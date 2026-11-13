/**
 * Satvik Swaad — Authoritative Order Lifecycle State Machine
 * Authority: docs/SPEC.md Section 4 (STATE-1 to STATE-6) and Appendix A2
 *
 * Rules:
 * - STATE-1: Legal transitions live in this ONE file as an explicit whitelist.
 * - STATE-2: Runs inside a Firestore transaction (compare-and-set).
 * - STATE-3: Appends immutable record to orders/{id}/events.
 * - STATE-4: Same-state transition is an idempotent no-op returning success.
 * - STATE-5: Terminal orderStatus (CANCELLED, EXPIRED, DELIVERED, RETURNED) never change,
 *   except EXPIRED -> CONFIRMED for late payment revival (Section 4.3).
 * - STATE-6: Step-up operations require admin authentication within last 300 seconds.
 */

import { OrderStatus, PaymentStatus } from './constants';

export class TransitionError extends Error {
  public readonly statusCode: number;
  constructor(message: string, statusCode = 409) {
    super(`[StateTransitionError] ${message}`);
    this.name = 'TransitionError';
    this.statusCode = statusCode;
  }
}

/**
 * Valid forward transitions for orderStatus (Section 4.2 & Appendix A2)
 */
const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PLACED: ['PLACED', 'CONFIRMED', 'CANCELLED', 'EXPIRED'],
  CONFIRMED: ['CONFIRMED', 'PROCESSING', 'CANCELLED'],
  PROCESSING: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
  SHIPPED: ['SHIPPED', 'DELIVERED', 'RETURNED'],
  DELIVERED: ['DELIVERED', 'RETURNED'],
  CANCELLED: ['CANCELLED'], // Terminal (STATE-5)
  EXPIRED: ['EXPIRED', 'CONFIRMED'], // Terminal except late payment revival (Section 4.3)
  RETURNED: ['RETURNED'] // Terminal (STATE-5)
};

/**
 * Valid transitions for paymentStatus (Section 4.4 & Appendix A2)
 */
const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  UNPAID: ['UNPAID', 'PENDING_VERIFICATION', 'PAID', 'COD_DUE', 'FAILED'],
  PENDING_VERIFICATION: ['PENDING_VERIFICATION', 'PAID', 'FAILED'],
  PAID: ['PAID', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED', 'DISPUTED'],
  FAILED: ['FAILED', 'UNPAID'], // Customer retrying payment
  COD_DUE: ['COD_DUE', 'COD_COLLECTED', 'FAILED'],
  COD_COLLECTED: ['COD_COLLECTED', 'REFUND_PENDING'],
  REFUND_PENDING: ['REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED'],
  PARTIALLY_REFUNDED: ['PARTIALLY_REFUNDED', 'REFUND_PENDING', 'REFUNDED'],
  REFUNDED: ['REFUNDED'], // Terminal
  DISPUTED: ['DISPUTED', 'PAID', 'REFUNDED']
};

/**
 * Actions that strictly require step-up authentication within 300 seconds (STATE-6, AUTH-5)
 */
const STEP_UP_REQUIRED_ACTIONS = new Set<string>([
  'ORDER_CANCEL_AFTER_CONFIRMATION',
  'ORDER_MARK_RETURNED',
  'MANUAL_UPI_VERIFY',
  'REFUND_CREATE',
  'PRICE_MODIFY'
]);

/**
 * Checks whether a given transition is permitted under the specification whitelist.
 */
export function isValidTransition(
  type: 'order' | 'payment',
  fromStatus: string,
  toStatus: string
): boolean {
  if (type === 'order') {
    const allowed = ORDER_TRANSITIONS[fromStatus as OrderStatus];
    if (!allowed) return false;
    return allowed.includes(toStatus as OrderStatus);
  } else {
    const allowed = PAYMENT_TRANSITIONS[fromStatus as PaymentStatus];
    if (!allowed) return false;
    return allowed.includes(toStatus as PaymentStatus);
  }
}

/**
 * Returns allowed next order statuses from current state.
 */
export function getNextValidOrderStatuses(currentStatus: OrderStatus): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[currentStatus] || [];
}

/**
 * Returns allowed next payment statuses from current state.
 */
export function getNextValidPaymentStatuses(currentStatus: PaymentStatus): readonly PaymentStatus[] {
  return PAYMENT_TRANSITIONS[currentStatus] || [];
}

/**
 * Validates step-up authentication freshness. (STATE-6, AUTH-5)
 * Re-authentication must have occurred within the last 300 seconds.
 */
export function assertStepUpFreshness(
  authTimestampSeconds: number,
  nowSeconds = Math.floor(Date.now() / 1000)
): void {
  const elapsed = nowSeconds - authTimestampSeconds;
  if (elapsed < 0 || elapsed > 300) {
    throw new TransitionError(
      `Step-up authentication expired or missing. Last auth was ${elapsed}s ago (maximum 300s). Re-authentication required.`,
      403
    );
  }
}

export interface TransitionParams {
  currentOrderStatus: OrderStatus;
  targetOrderStatus?: OrderStatus;
  currentPaymentStatus?: PaymentStatus;
  targetPaymentStatus?: PaymentStatus;
  actor: {
    uid: string;
    role: string;
    authTimestampSeconds?: number;
  };
  reason?: string;
}

export interface TransitionResult {
  orderStatus: OrderStatus;
  paymentStatus?: PaymentStatus;
  changed: boolean;
}

/**
 * Centrally validates state machine transition per STATE-1..6 and Section 4.
 */
export function validateAndCalculateTransition(params: TransitionParams): TransitionResult {
  const { currentOrderStatus, targetOrderStatus, currentPaymentStatus, targetPaymentStatus, actor } = params;

  // STATE-4: Same-state transition is an idempotent no-op returning success
  if (
    (!targetOrderStatus || targetOrderStatus === currentOrderStatus) &&
    (!targetPaymentStatus || targetPaymentStatus === currentPaymentStatus)
  ) {
    return {
      orderStatus: currentOrderStatus,
      paymentStatus: currentPaymentStatus,
      changed: false
    };
  }

  let nextOrderStatus = currentOrderStatus;
  if (targetOrderStatus && targetOrderStatus !== currentOrderStatus) {
    if (!isValidTransition('order', currentOrderStatus, targetOrderStatus)) {
      throw new TransitionError(
        `Illegal order status transition from '${currentOrderStatus}' to '${targetOrderStatus}'.`,
        400
      );
    }
    // STATE-5: Terminal states CANCELLED and RETURNED never change
    if (currentOrderStatus === 'CANCELLED' || currentOrderStatus === 'RETURNED') {
      throw new TransitionError(
        `Terminal state '${currentOrderStatus}' cannot be transitioned to '${targetOrderStatus}'.`,
        400
      );
    }
    // DELIVERED can only transition to RETURNED (Section 4.2)
    if (currentOrderStatus === 'DELIVERED' && targetOrderStatus !== 'RETURNED') {
      throw new TransitionError(
        `DELIVERED orders can only transition to RETURNED.`,
        400
      );
    }
    // EXPIRED can only transition to CONFIRMED (Section 4.3 late payment revival)
    if (currentOrderStatus === 'EXPIRED' && targetOrderStatus !== 'CONFIRMED') {
      throw new TransitionError(
        `EXPIRED orders can only transition to CONFIRMED via late payment revival.`,
        400
      );
    }
    // Check step-up if required (STATE-6, AUTH-5)
    if (
      (currentOrderStatus === 'CONFIRMED' && targetOrderStatus === 'CANCELLED') ||
      targetOrderStatus === 'RETURNED'
    ) {
      if (!actor.authTimestampSeconds) {
        throw new TransitionError('Step-up authentication required for this transition.', 403);
      }
      assertStepUpFreshness(actor.authTimestampSeconds);
    }
    nextOrderStatus = targetOrderStatus;
  }

  let nextPaymentStatus = currentPaymentStatus;
  if (targetPaymentStatus && currentPaymentStatus && targetPaymentStatus !== currentPaymentStatus) {
    if (!isValidTransition('payment', currentPaymentStatus, targetPaymentStatus)) {
      throw new TransitionError(
        `Illegal payment status transition from '${currentPaymentStatus}' to '${targetPaymentStatus}'.`,
        400
      );
    }
    nextPaymentStatus = targetPaymentStatus;
  }

  return {
    orderStatus: nextOrderStatus,
    paymentStatus: nextPaymentStatus,
    changed: true
  };
}

export interface TransitionContext {
  orderId: string;
  targetOrderStatus?: OrderStatus;
  targetPaymentStatus?: PaymentStatus;
  actor: {
    uid: string;
    role: string;
    authTimestampSeconds?: number;
  };
  reason?: string;
  existingTransaction?: any;
}

export interface TransitionExecutionResult {
  success: boolean;
  orderId: string;
  previousOrderStatus: OrderStatus;
  newOrderStatus: OrderStatus;
  previousPaymentStatus?: PaymentStatus;
  newPaymentStatus?: PaymentStatus;
  version: number;
  changed: boolean;
}

/**
 * Executes a canonical order state machine transition inside a Firestore transaction (STATE-1, STATE-2, STATE-3).
 * Enforces compare-and-set semantics, increments order.version, and writes an append-only event to orders/{id}/events.
 */
export async function transition(
  db: any,
  context: TransitionContext
): Promise<TransitionExecutionResult> {
  const { orderId, targetOrderStatus, targetPaymentStatus, actor, reason, existingTransaction } = context;

  const executeInsideTransaction = async (txn: any): Promise<TransitionExecutionResult> => {
    const orderRef = db.collection('orders').doc(orderId);
    const snap = await txn.get(orderRef);
    if (!snap.exists) {
      throw new TransitionError(`Order ${orderId} does not exist`, 404);
    }

    const orderData = snap.data();
    const currentOrderStatus = orderData.orderStatus as OrderStatus;
    const currentPaymentStatus = orderData.paymentStatus as PaymentStatus | undefined;
    const currentVersion = typeof orderData.version === 'number' ? orderData.version : 0;

    const calc = validateAndCalculateTransition({
      currentOrderStatus,
      targetOrderStatus,
      currentPaymentStatus,
      targetPaymentStatus,
      actor,
      reason
    });

    if (!calc.changed) {
      // STATE-4: Same-state transition is an idempotent no-op returning success
      return {
        success: true,
        orderId,
        previousOrderStatus: currentOrderStatus,
        newOrderStatus: currentOrderStatus,
        previousPaymentStatus: currentPaymentStatus,
        newPaymentStatus: currentPaymentStatus,
        version: currentVersion,
        changed: false
      };
    }

    const newVersion = currentVersion + 1;
    const updatePayload: Record<string, any> = {
      orderStatus: calc.orderStatus,
      version: newVersion,
      updatedAt: new Date().toISOString()
    };

    if (calc.paymentStatus) {
      updatePayload.paymentStatus = calc.paymentStatus;
    }

    txn.update(orderRef, updatePayload);

    // STATE-3: Append immutable record to orders/{id}/events
    const eventRef = orderRef.collection('events').doc();
    txn.create(eventRef, {
      fromOrderStatus: currentOrderStatus,
      toOrderStatus: calc.orderStatus,
      fromPaymentStatus: currentPaymentStatus || null,
      toPaymentStatus: calc.paymentStatus || null,
      actor,
      reason: reason || null,
      version: newVersion,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      orderId,
      previousOrderStatus: currentOrderStatus,
      newOrderStatus: calc.orderStatus,
      previousPaymentStatus: currentPaymentStatus,
      newPaymentStatus: calc.paymentStatus,
      version: newVersion,
      changed: true
    };
  };

  if (existingTransaction) {
    return executeInsideTransaction(existingTransaction);
  } else {
    return db.runTransaction(executeInsideTransaction);
  }
}
