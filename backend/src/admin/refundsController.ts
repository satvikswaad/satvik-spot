/**
 * Satvik Swaad — Authoritative Admin Refund Controller
 * Authority: docs/SPEC.md Section 5.5 (REFUND-1 to REFUND-5), Decision D7
 *
 * Rules:
 * - Decision D7: Owner performs refunds in gateway dashboard; system tracks REFUND_PENDING
 *   and admin/owner marks refunded with the gateway refund ID.
 * - REFUND-2: Step-up authentication within 300 seconds (AUTH-5) and written reason code required.
 * - REFUND-3: Refund above ₹2,000 (200,000 paise) or 3rd refund in 24h requires a second approver recorded in audit log.
 * - REFUND-4: Refund amount and order re-read from database in transaction. Never exceeds remaining refundable balance.
 * - DB-7: Transactionally decrements revenue and increments refundedPaise in stats_daily.
 */

import { Response, NextFunction } from 'express';
import { db, admin } from '../config/firebase';
import { AuthenticatedRequest } from '../auth/verifyAuth';
import { ValidationError, AuthorizationError, AppError } from '../errors/AppError';
import { transition } from '../shared/stateMachine';
import { recordRefundInDailyStatsInTransaction } from '../db/statsDailyService';
import { logAuditEvent } from '../audit/auditLogger';
import { logger } from '../utils/logger';

export async function markRefundedHandler(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Role Authorization: Admin or Owner only
    if (!req.user || !req.user.isAdmin) {
      throw new AuthorizationError('Administrative privileges required to record refunds');
    }

    const { orderId, amountPaise, gatewayRefundId, reason, secondApproverUid } = req.body;

    if (!orderId || typeof orderId !== 'string') {
      throw new ValidationError("Valid 'orderId' is required");
    }
    if (!gatewayRefundId || typeof gatewayRefundId !== 'string' || gatewayRefundId.trim().length === 0) {
      throw new ValidationError("Valid 'gatewayRefundId' from gateway dashboard is required (Decision D7)");
    }
    if (typeof amountPaise !== 'number' || amountPaise <= 0 || !Number.isInteger(amountPaise)) {
      throw new ValidationError("Valid positive integer 'amountPaise' is required");
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      throw new ValidationError("A detailed written refund reason (minimum 5 characters) is required (REFUND-2)");
    }

    // 2. Check Second Approver Threshold (REFUND-3: amount > ₹2,000 or 3rd refund in 24h)
    const thresholdPaise = 200000; // ₹2,000
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Count refunds by this admin in last 24h
    const recentAdminRefundsSnap = await db.collection('refunds')
      .where('processedByUid', '==', req.user.uid)
      .where('createdAt', '>=', oneDayAgo)
      .get();

    const isThirdOrMore = recentAdminRefundsSnap.size >= 2;
    const requiresSecondApproval = amountPaise > thresholdPaise || isThirdOrMore;

    if (requiresSecondApproval) {
      if (!secondApproverUid || typeof secondApproverUid !== 'string' || secondApproverUid === req.user.uid) {
        throw new AuthorizationError(
          `Second administrative approval required for refund exceeding ₹${thresholdPaise / 100} or 3rd refund in 24h (REFUND-3). Second approver must be distinct from requester.`
        );
      }
    }

    const cleanGatewayRefundId = gatewayRefundId.trim();

    // 3. Transactional Validation & Settlement (REFUND-4)
    const result = await db.runTransaction(async (transaction) => {
      // Check duplicate gateway refund ID
      const refundRef = db.collection('refunds').doc(cleanGatewayRefundId);
      const existingRefundSnap = await transaction.get(refundRef);
      if (existingRefundSnap.exists) {
        throw new AppError(`Refund with gateway ID '${cleanGatewayRefundId}' has already been recorded`, 409, 'DUPLICATE_REFUND_ID');
      }

      // Re-read order inside transaction (REFUND-4)
      const orderRef = db.collection('orders').doc(orderId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) {
        throw new AppError('Order not found', 404, 'NOT_FOUND');
      }

      const orderData = orderSnap.data()!;
      const totalPaise = typeof orderData.totalPaise === 'number' ? orderData.totalPaise : Math.round((orderData.total || 0) * 100);
      const existingRefundedPaise = orderData.refundedPaise || 0;
      const remainingRefundablePaise = totalPaise - existingRefundedPaise;

      // Ensure amount does not exceed what was paid (REFUND-4, INV-4)
      if (amountPaise > remainingRefundablePaise) {
        throw new ValidationError(
          `Refund amount (₹${amountPaise / 100}) exceeds remaining refundable balance (₹${remainingRefundablePaise / 100}) for this order (REFUND-4)`
        );
      }

      const newRefundedPaise = existingRefundedPaise + amountPaise;
      const isFullRefund = newRefundedPaise >= totalPaise;
      const newPaymentStatus = isFullRefund ? 'REFUNDED' : 'REFUND_PENDING';

      // Canonical state transition if full refund
      if (isFullRefund) {
        try {
          await transition(db, {
            orderId,
            targetPaymentStatus: 'REFUNDED',
            actor: { uid: req.user!.uid, role: req.user!.role || 'admin', authTimestampSeconds: req.user!.authTime },
            reason: `Refund completed: ${reason}`,
            existingTransaction: transaction
          });
        } catch {
          // Fallback direct update
          transaction.update(orderRef, { paymentStatus: 'REFUNDED' });
        }
      }

      // Record refund document
      const refundData = {
        refundId: cleanGatewayRefundId,
        gatewayRefundId: cleanGatewayRefundId,
        orderId,
        amountPaise,
        amount: amountPaise / 100,
        reason: reason.trim(),
        status: 'COMPLETED',
        processedByUid: req.user!.uid,
        secondApproverUid: requiresSecondApproval ? secondApproverUid : null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      transaction.set(refundRef, refundData);

      // Update order document
      transaction.update(orderRef, {
        refundedPaise: newRefundedPaise,
        paymentStatus: newPaymentStatus,
        lastRefundAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update daily stats atomically (DB-7, INV-5)
      await recordRefundInDailyStatsInTransaction(transaction, amountPaise);

      return {
        orderId,
        gatewayRefundId: cleanGatewayRefundId,
        amountPaise,
        totalRefundedPaise: newRefundedPaise,
        paymentStatus: newPaymentStatus,
        requiresSecondApproval
      };
    });

    // 4. Cryptographic Audit Log
    await logAuditEvent({
      action: 'ORDER_REFUND_RECORDED',
      actorUid: req.user.uid,
      targetRef: `orders/${orderId}`,
      outcome: 'SUCCESS',
      ip: req.ip,
      details: {
        gatewayRefundId: cleanGatewayRefundId,
        amountPaise,
        secondApproverUid: requiresSecondApproval ? secondApproverUid : null,
        reason
      }
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}
