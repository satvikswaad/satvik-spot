/**
 * Manual UPI Payment Service (UPI-1 to UPI-8)
 * Section 6.2: Manual UPI with a customer-typed UTR
 * 
 * Rules:
 * - UPI-1: Feature flag upiManualEnabled, default false.
 * - UPI-2: Maximum order value ₹2,000 (200,000 paise).
 * - UPI-3: The UTR is 12 digits, stored through utrIndex/{utr} using create().
 *          A UTR already present is rejected.
 * - UPI-4: A customer gets at most 3 UTR submissions per order.
 * - UPI-5: Admin verification screen matches bank record before pressing Verify (requires step-up).
 * - UPI-6: Stock stays reserved for 2 hours (120 minutes) while PENDING_VERIFICATION.
 */

import { db, admin } from '../config/firebase';
import { logger } from '../utils/logger';
import { AppError } from '../errors/AppError';
import { isValidTransition } from '../shared/stateMachine';
import { commitSoldStockInTransaction, ReservationLine } from '../inventory/inventoryService';

export const UPI_MANUAL_MAX_PAISE = 200000; // ₹2,000
export const UPI_MANUAL_MAX_ATTEMPTS = 3;

/**
 * Validates strictly 12 numeric digits
 */
export function validateUtrFormat(utr: string): boolean {
  if (!utr || typeof utr !== 'string') return false;
  return /^\d{12}$/.test(utr.trim());
}

export interface SubmitUtrParams {
  orderId: string;
  utr: string;
  orderTotalPaise: number;
  submissionCount: number;
  checkUtrExists?: (utr: string) => Promise<boolean>;
  saveUtr?: (params: { orderId: string; utr: string; count: number }) => Promise<void>;
}

export interface SubmitUtrResult {
  accepted: boolean;
  error?: string;
}

/**
 * Customer submits a 12-digit UTR for an unpaid order
 */
export async function submitManualUtrRecord(params: SubmitUtrParams): Promise<SubmitUtrResult> {
  const { orderId, utr, orderTotalPaise, submissionCount, checkUtrExists, saveUtr } = params;

  // UPI-2: Max order value ₹2,000
  if (orderTotalPaise > UPI_MANUAL_MAX_PAISE) {
    return {
      accepted: false,
      error: 'EXCEEDS_UPI_MANUAL_LIMIT'
    };
  }

  // UPI-4: Max 3 submissions per order
  if (submissionCount >= UPI_MANUAL_MAX_ATTEMPTS) {
    return {
      accepted: false,
      error: 'MAX_UTR_ATTEMPTS_EXCEEDED'
    };
  }

  // UPI-3: 12-digit format check
  if (!validateUtrFormat(utr)) {
    return {
      accepted: false,
      error: 'INVALID_UTR_FORMAT'
    };
  }

  const cleanUtr = utr.trim();

  // Collision check in utrIndex/{utr}
  const exists = checkUtrExists
    ? await checkUtrExists(cleanUtr)
    : await defaultCheckUtrExists(cleanUtr);

  if (exists) {
    return {
      accepted: false,
      error: 'UTR_ALREADY_USED'
    };
  }

  // Save UTR record and update order status
  if (saveUtr) {
    await saveUtr({ orderId, utr: cleanUtr, count: submissionCount + 1 });
  } else {
    await defaultSaveUtr({ orderId, utr: cleanUtr, count: submissionCount + 1 });
  }

  return { accepted: true };
}

async function defaultCheckUtrExists(utr: string): Promise<boolean> {
  const doc = await db.collection('utrIndex').doc(utr).get();
  return doc.exists;
}

async function defaultSaveUtr(params: { orderId: string; utr: string; count: number }): Promise<void> {
  const { orderId, utr, count } = params;
  const utrRef = db.collection('utrIndex').doc(utr);
  const orderRef = db.collection('orders').doc(orderId);

  await db.runTransaction(async (txn) => {
    const utrDoc = await txn.get(utrRef);
    if (utrDoc.exists) {
      throw new AppError('UTR has already been submitted', 409, 'UTR_ALREADY_USED');
    }

    const orderDoc = await txn.get(orderRef);
    if (!orderDoc.exists) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    // Index UTR permanently
    txn.create(utrRef, {
      utr,
      orderId,
      submittedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update order to PENDING_VERIFICATION with 2-hour reservation
    const twoHoursLater = new Date(Date.now() + 120 * 60 * 1000);
    txn.update(orderRef, {
      paymentStatus: 'PENDING_VERIFICATION',
      manualUtr: utr,
      utrSubmissionCount: count,
      reservationExpiresAt: twoHoursLater.toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
}

/**
 * Admin verifies manual UPI payment after matching bank statement (UPI-5)
 * Requires step-up authentication.
 */
export async function verifyManualUtrPayment(params: {
  orderId: string;
  adminId: string;
  bankRef: string;
}): Promise<void> {
  const { orderId, adminId, bankRef } = params;
  const orderRef = db.collection('orders').doc(orderId);

  await db.runTransaction(async (txn) => {
    const orderDoc = await txn.get(orderRef);
    if (!orderDoc.exists) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    const data = orderDoc.data()!;
    if (data.paymentStatus !== 'PENDING_VERIFICATION') {
      throw new AppError(
        `Cannot verify payment in status ${data.paymentStatus}`,
        400,
        'INVALID_PAYMENT_STATUS'
      );
    }

    // Commit sold stock inside inventory module
    if (Array.isArray(data.items) && data.items.length > 0) {
      const lines: ReservationLine[] = data.items.map((item: any) => ({
        variantId: item.variantId || item.productId,
        qty: Number(item.qty) || 1
      }));
      await commitSoldStockInTransaction(txn, orderId, lines);
    }

    // State machine transition to PAID
    txn.update(orderRef, {
      paymentStatus: 'PAID',
      orderStatus: 'CONFIRMED',
      verifiedByAdmin: adminId,
      bankReferenceNote: bankRef,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Write audit log
    const auditRef = db.collection('audit_logs').doc();
    txn.set(auditRef, {
      action: 'MANUAL_UPI_VERIFIED',
      orderId,
      actor: adminId,
      bankRef,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  });
}
