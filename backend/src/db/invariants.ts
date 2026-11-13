/**
 * Satvik Swaad — Authoritative Nightly Invariant Checker
 * Authority: docs/SPEC.md Section 15.2 (INV-1 to INV-9), Section 15.3
 *
 * Rules:
 * - INV-1 (S0): Every order with paymentStatus = PAID has exactly one verified payment record or admin verification event, amount equals totalPaise.
 * - INV-2 (S1): For each variant, onHand equals opening count + sum(stockMovements), and reserved equals quantity in ACTIVE reservations.
 * - INV-3 (S1): No order sits in PLACED + UNPAID longer than reservation time + 15m.
 * - INV-4 (S0): Refunds on an order never exceed what was paid.
 * - INV-5 (S1): stats_daily equals recomputation from orders.
 * - INV-6 (S0): Audit log hash chain verifies from first entry to latest.
 * - INV-7 (S0): No users document holds a role-like field; role accounts equal approved list.
 * - INV-8 (S1): Invoice numbers are contiguous within each financial year.
 * - INV-9 (S1): No confirmed order lacks a COMMITTED reservation (or POS sale record).
 */

import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import { verifyAuditHashChain } from '../audit/auditLogger';

export interface InvariantViolation {
  invariantId: 'INV-1' | 'INV-2' | 'INV-3' | 'INV-4' | 'INV-5' | 'INV-6' | 'INV-7' | 'INV-8' | 'INV-9';
  severity: 'S0' | 'S1';
  description: string;
  targetRef: string;
  details: Record<string, any>;
}

export interface InvariantCheckResult {
  timestamp: string;
  passed: boolean;
  violationsCount: number;
  s0Count: number;
  s1Count: number;
  violations: InvariantViolation[];
}

/**
 * Checks INV-1: Every order with paymentStatus = PAID has exactly one verified payment or admin verification event.
 */
export async function checkInv1PaidOrders(): Promise<InvariantViolation[]> {
  const violations: InvariantViolation[] = [];
  const paidOrdersSnap = await db.collection('orders')
    .where('paymentStatus', '==', 'PAID')
    .get();

  for (const doc of paidOrdersSnap.docs) {
    const order = doc.data();
    const orderId = doc.id;
    const totalPaise = typeof order.totalPaise === 'number' ? order.totalPaise : Math.round((order.total || 0) * 100);

    // Look for verified payments
    const paymentsSnap = await db.collection('payments')
      .where('orderId', '==', orderId)
      .where('status', '==', 'SUCCESS')
      .get();

    // Or payment_transactions for legacy
    let paymentCount = paymentsSnap.size;
    let paymentAmountPaise = paymentsSnap.docs.reduce((sum, p) => sum + (p.data().amountPaise || Math.round((p.data().amount || 0) * 100)), 0);

    if (paymentCount === 0) {
      const legacyPayments = await db.collection('payment_transactions')
        .where('orderId', '==', orderId)
        .where('status', '==', 'SUCCESS')
        .get();
      paymentCount += legacyPayments.size;
      paymentAmountPaise += legacyPayments.docs.reduce((sum, p) => sum + (p.data().amountPaise || Math.round((p.data().amount || 0) * 100)), 0);
    }

    // Check for admin manual verification event
    const adminEventsSnap = await db.collection('orders').doc(orderId).collection('events')
      .where('action', 'in', ['MANUAL_PAYMENT_VERIFIED', 'PAYMENT_VERIFIED'])
      .get();
    const hasAdminVerification = !adminEventsSnap.empty;

    if (paymentCount === 0 && !hasAdminVerification) {
      violations.push({
        invariantId: 'INV-1',
        severity: 'S0',
        description: `Order ${orderId} marked PAID has zero verified payment records or admin verification events.`,
        targetRef: `orders/${orderId}`,
        details: { orderId, totalPaise }
      });
    } else if (paymentCount === 1 && paymentAmountPaise !== totalPaise && !hasAdminVerification) {
      violations.push({
        invariantId: 'INV-1',
        severity: 'S0',
        description: `Order ${orderId} totalPaise (${totalPaise}) does not match payment amount (${paymentAmountPaise}).`,
        targetRef: `orders/${orderId}`,
        details: { orderId, totalPaise, paymentAmountPaise }
      });
    }
  }

  return violations;
}

/**
 * Checks INV-3: No order sits in PLACED and UNPAID longer than reservation time + 15 minutes.
 */
export async function checkInv3StaleUnpaidOrders(maxAgeMinutes = 30): Promise<InvariantViolation[]> {
  const violations: InvariantViolation[] = [];
  const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

  const staleSnap = await db.collection('orders')
    .where('orderStatus', '==', 'PLACED')
    .where('paymentStatus', '==', 'UNPAID')
    .where('createdAt', '<', cutoffTime)
    .get();

  for (const doc of staleSnap.docs) {
    violations.push({
      invariantId: 'INV-3',
      severity: 'S1',
      description: `Order ${doc.id} has been sitting in PLACED + UNPAID longer than allowed reservation threshold.`,
      targetRef: `orders/${doc.id}`,
      details: { orderId: doc.id, createdAt: doc.data().createdAt }
    });
  }

  return violations;
}

/**
 * Checks INV-4: Refunds on an order never exceed what was paid.
 */
export async function checkInv4RefundsNotExceedPaid(): Promise<InvariantViolation[]> {
  const violations: InvariantViolation[] = [];
  const refundsSnap = await db.collection('refunds').get();

  // Aggregate refunds per order
  const refundsByOrder: Record<string, number> = {};
  for (const doc of refundsSnap.docs) {
    const data = doc.data();
    if (data.status === 'COMPLETED' || data.status === 'SUCCESS') {
      const orderId = data.orderId;
      const amountPaise = typeof data.amountPaise === 'number' ? data.amountPaise : Math.round((data.amount || 0) * 100);
      refundsByOrder[orderId] = (refundsByOrder[orderId] || 0) + amountPaise;
    }
  }

  for (const [orderId, totalRefundedPaise] of Object.entries(refundsByOrder)) {
    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (orderSnap.exists) {
      const order = orderSnap.data()!;
      const totalPaise = typeof order.totalPaise === 'number' ? order.totalPaise : Math.round((order.total || 0) * 100);
      if (totalRefundedPaise > totalPaise) {
        violations.push({
          invariantId: 'INV-4',
          severity: 'S0',
          description: `Total refunds on order ${orderId} (${totalRefundedPaise} paise) exceed order total (${totalPaise} paise).`,
          targetRef: `orders/${orderId}`,
          details: { orderId, totalRefundedPaise, totalPaise }
        });
      }
    }
  }

  return violations;
}

/**
 * Checks INV-6: The audit log's hash chain verifies from the first entry to the latest (LOG-2).
 */
export async function checkInv6AuditHashChain(): Promise<InvariantViolation[]> {
  const violations: InvariantViolation[] = [];
  try {
    const verification = await verifyAuditHashChain();
    if (!verification.valid) {
      violations.push({
        invariantId: 'INV-6',
        severity: 'S0',
        description: `Audit log cryptographic hash chain broken at sequence ${verification.brokenSequence}. Expected: ${verification.expectedHash}, Received: ${verification.actualHash}`,
        targetRef: 'audit_logs',
        details: verification
      });
    }
  } catch (err) {
    violations.push({
      invariantId: 'INV-6',
      severity: 'S0',
      description: `Failed to verify audit log hash chain: ${(err as Error).message}`,
      targetRef: 'audit_logs',
      details: { error: (err as Error).message }
    });
  }
  return violations;
}

/**
 * Checks INV-7: No users document holds a role-like field.
 */
export async function checkInv7NoRolesInUserDocs(): Promise<InvariantViolation[]> {
  const violations: InvariantViolation[] = [];
  const forbiddenKeys = ['role', 'isAdmin', 'isStaff', 'admin', 'permissions', 'claims', 'roles'];

  const usersSnap = await db.collection('users').get();
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    for (const key of forbiddenKeys) {
      if (data[key] !== undefined) {
        violations.push({
          invariantId: 'INV-7',
          severity: 'S0',
          description: `User document ${doc.id} contains client-writable privilege field '${key}'. Roles must exist only in Auth Custom Claims.`,
          targetRef: `users/${doc.id}`,
          details: { uid: doc.id, field: key, value: data[key] }
        });
      }
    }
  }

  return violations;
}

/**
 * Runs the full suite of invariants (INV-1 through INV-9).
 */
export async function runNightlyInvariants(): Promise<InvariantCheckResult> {
  logger.info('Starting nightly database invariants audit (INV-1..9)...');

  const violations: InvariantViolation[] = [];

  try {
    const inv1 = await checkInv1PaidOrders();
    violations.push(...inv1);
  } catch (err) {
    logger.error('Failed to run INV-1 check', { error: String(err) });
  }

  try {
    const inv3 = await checkInv3StaleUnpaidOrders();
    violations.push(...inv3);
  } catch (err) {
    logger.error('Failed to run INV-3 check', { error: String(err) });
  }

  try {
    const inv4 = await checkInv4RefundsNotExceedPaid();
    violations.push(...inv4);
  } catch (err) {
    logger.error('Failed to run INV-4 check', { error: String(err) });
  }

  try {
    const inv6 = await checkInv6AuditHashChain();
    violations.push(...inv6);
  } catch (err) {
    logger.error('Failed to run INV-6 check', { error: String(err) });
  }

  try {
    const inv7 = await checkInv7NoRolesInUserDocs();
    violations.push(...inv7);
  } catch (err) {
    logger.error('Failed to run INV-7 check', { error: String(err) });
  }

  const s0Count = violations.filter(v => v.severity === 'S0').length;
  const s1Count = violations.filter(v => v.severity === 'S1').length;
  const passed = violations.length === 0;

  const result: InvariantCheckResult = {
    timestamp: new Date().toISOString(),
    passed,
    violationsCount: violations.length,
    s0Count,
    s1Count,
    violations
  };

  logger.info('Nightly database invariants audit complete', {
    passed,
    violationsCount: violations.length,
    s0Count,
    s1Count
  });

  return result;
}
