/**
 * Satvik Swaad — Authoritative Order & Reservation Expiry Job
 * Authority: docs/SPEC.md Section 8.4, 8.5 (ARCH-8, DISC-3, STOCK-4)
 *
 * Rules:
 * - 8.4: PayU/Razorpay held for 15m; COD held for 30m; WhatsApp/Manual UPI held for 2 hours.
 * - 8.5: Atomically releases stock, sets orderStatus = EXPIRED, paymentStatus = FAILED,
 *   releases discount redemption (DISC-3), and writes state event.
 * - ARCH-8: Secured by internal job authentication secret.
 */

import { Request, Response, NextFunction } from 'express';
import { db, admin } from '../config/firebase';
import { transition } from '../shared/stateMachine';
import { releaseReservationInTransaction, ReservationLine } from '../inventory/inventoryService';
import { releaseCouponRedemptionInTransaction } from '../coupons/couponService';
import { CONFIG_LIMITS } from '../shared/constants';
import { AuthenticationError } from '../errors/AppError';
import { logger } from '../utils/logger';

export interface ExpiryJobResult {
  processedCount: number;
  expiredCount: number;
  skippedCount: number;
  errors: Array<{ orderId: string; error: string }>;
}

/**
 * Middleware that authenticates cron / background worker triggers (ARCH-8).
 */
export function requireJobSecret(req: Request, _res: Response, next: NextFunction): void {
  const secret = process.env.JOB_SECRET || process.env.CRON_SECRET || 'dev-job-secret-at-least-32-bytes-long!';
  const provided = req.headers['x-job-secret'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '');

  if (process.env.NODE_ENV === 'test' && !req.headers['x-test-enforce-job-secret']) {
    return next();
  }

  if (!provided || provided !== secret) {
    logger.warn('Unauthorized attempt to trigger background job', { ip: req.ip, path: req.originalUrl });
    return next(new AuthenticationError('Unauthorized job execution request'));
  }

  return next();
}

/**
 * Runs the order & reservation expiration pass. (Section 8.5)
 */
export async function runOrderExpiryJob(): Promise<ExpiryJobResult> {
  const now = new Date();
  const nowMs = now.getTime();
  logger.info('Executing scheduled order expiration job...', { timestamp: now.toISOString() });

  const result: ExpiryJobResult = {
    processedCount: 0,
    expiredCount: 0,
    skippedCount: 0,
    errors: []
  };

  try {
    // 1. Process expired reservations in `reservations` collection (8.5 step 1)
    const expiredResQuery = await db.collection('reservations')
      .where('status', '==', 'ACTIVE')
      .where('expiresAt', '<=', now)
      .limit(50)
      .get();

    for (const resDoc of expiredResQuery.docs) {
      result.processedCount++;
      const resData = resDoc.data();
      const orderId = resDoc.id;

      try {
        await db.runTransaction(async (txn) => {
          const ordRef = db.collection('orders').doc(orderId);
          const ordSnap = await txn.get(ordRef);

          if (!ordSnap.exists) {
            // Just release reservation if order does not exist
            txn.update(resDoc.ref, { status: 'RELEASED', releaseReason: 'ORDER_NOT_FOUND' });
            return;
          }

          const ordData = ordSnap.data()!;
          // If order is already settled or paid, do not expire
          if (ordData.paymentStatus === 'PAID' || ordData.orderStatus === 'CONFIRMED') {
            result.skippedCount++;
            return;
          }

          // 8.5 Step 3: Atomic transition to EXPIRED + FAILED
          await transition(db, {
            orderId,
            targetOrderStatus: 'EXPIRED',
            targetPaymentStatus: 'FAILED',
            actor: { uid: 'EXPIRY_JOB', role: 'owner' },
            reason: 'RESERVATION_EXPIRED',
            existingTransaction: txn
          });

          // Release stock reservation
          const lines: ReservationLine[] = (resData.lines || []).map((l: any) => ({
            variantId: l.variantId,
            qty: l.qty
          }));
          if (lines.length > 0) {
            await releaseReservationInTransaction(txn, orderId, lines, 'EXPIRED_TIMEOUT');
          }

          // Release discount coupon redemption if any (DISC-3)
          if (ordData.discountCode) {
            await releaseCouponRedemptionInTransaction(txn, ordData.discountCode, orderId);
          }
        });

        result.expiredCount++;
        logger.info(`Expired stale reservation for order ${orderId}`, { orderId });
      } catch (err) {
        result.errors.push({ orderId, error: (err as Error).message });
        logger.error(`Error expiring reservation for order ${orderId}`, { error: (err as Error).message });
      }
    }

    // 2. Process stale PLACED + UNPAID orders exceeding channel reservation limits (8.4)
    // 15m for online, 30m for COD, 120m for WhatsApp/manual UPI
    const onlineTimeoutMs = (CONFIG_LIMITS.reserveOnlineMinutes || 15) * 60 * 1000;
    const onlineCutoff = new Date(nowMs - onlineTimeoutMs);

    const staleOrdersSnap = await db.collection('orders')
      .where('orderStatus', '==', 'PLACED')
      .where('paymentStatus', '==', 'UNPAID')
      .where('createdAt', '<=', onlineCutoff)
      .limit(50)
      .get();

    for (const ordDoc of staleOrdersSnap.docs) {
      const ordData = ordDoc.data();
      const orderId = ordDoc.id;

      // Check channel timeout threshold
      const isSlowChannel = ordData.channel === 'whatsapp' || ordData.paymentMethod === 'WhatsApp-Assisted Ordering' || ordData.paymentMethod === 'UPI';
      const isCod = ordData.paymentMethod === 'COD' || ordData.paymentMethod === 'Cash on Delivery';
      const thresholdMinutes = isSlowChannel ? (CONFIG_LIMITS.reserveSlowMinutes || 120) : (isCod ? (CONFIG_LIMITS.reserveCodMinutes || 30) : (CONFIG_LIMITS.reserveOnlineMinutes || 15));
      const orderCreatedMs = ordData.createdAt?.toDate ? ordData.createdAt.toDate().getTime() : (ordData.createdAt ? new Date(ordData.createdAt).getTime() : 0);

      if (nowMs - orderCreatedMs < thresholdMinutes * 60 * 1000) {
        // Not yet expired for this channel
        continue;
      }

      result.processedCount++;

      try {
        await db.runTransaction(async (txn) => {
          const freshSnap = await txn.get(ordDoc.ref);
          if (!freshSnap.exists) return;
          const fresh = freshSnap.data()!;

          if (fresh.paymentStatus === 'PAID' || fresh.orderStatus === 'CONFIRMED') {
            result.skippedCount++;
            return;
          }

          // Atomic transition
          await transition(db, {
            orderId,
            targetOrderStatus: 'EXPIRED',
            targetPaymentStatus: 'FAILED',
            actor: { uid: 'EXPIRY_JOB', role: 'owner' },
            reason: 'RESERVATION_TIMEOUT_EXPIRED',
            existingTransaction: txn
          });

          // Release coupon if used
          if (fresh.discountCode) {
            await releaseCouponRedemptionInTransaction(txn, fresh.discountCode, orderId);
          }
        });

        result.expiredCount++;
        logger.info(`Expired stale order ${orderId} past channel threshold (${thresholdMinutes}m)`, { orderId });
      } catch (err) {
        result.errors.push({ orderId, error: (err as Error).message });
      }
    }
  } catch (err) {
    logger.error('Error running order expiry job', { error: (err as Error).message });
  }

  return result;
}

/**
 * HTTP handler for triggering the order expiry job via cron / worker.
 */
export async function handleTriggerOrderExpiryJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await runOrderExpiryJob();
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}
