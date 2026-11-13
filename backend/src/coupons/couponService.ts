/**
 * Satvik Swaad — Authoritative Discount & Redemption Engine
 * Authority: docs/SPEC.md Section 7.3 (DISC-1 to DISC-5)
 *
 * Rules:
 * - DISC-1: Code document has type (PERCENT or FLAT_PAISE), value, minSpend, maxUses, perUserLimit, dates, guestAllowed.
 * - DISC-2: Redemption happens inside the order creation transaction:
 *           checks limits, writes redemptions/{code}_{orderId}, increments usedCount.
 * - DISC-3: Releases redemption if order ends EXPIRED or CANCELLED without payment.
 * - DISC-4: Guest checkouts may use only codes marked guestAllowed, tracked by customer phone.
 * - DISC-5: Code verification attempts rate-limited (10 per 10m per IP/user), error never reveals if code exists.
 */

import { db, admin } from '../config/firebase';
import { DiscountDoc } from '../pricing/pricingEngine';
import { ValidationError, AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

export interface CouponRecord extends DiscountDoc {
  guestAllowed?: boolean;
  maxUsesPerUser?: number;
  startDate?: string;
  endDate?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  discountPaise: number;
  reason?: string;
  couponDoc?: CouponRecord;
}

/**
 * Validates a coupon inside an active Firestore transaction and prepares redemption. (DISC-1..4)
 */
export async function validateAndRedeemCouponInTransaction(
  transaction: admin.firestore.Transaction,
  code: string,
  orderId: string,
  subtotalPaise: number,
  userId?: string | null,
  phone?: string
): Promise<{ discountPaise: number; code: string } | null> {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) return null;

  // 1. Fetch discount doc from discounts collection (Canonical: discounts per Section 7.3, 11.1)
  const discountRef = db.collection('discounts').doc(cleanCode);
  const snap = await transaction.get(discountRef);

  if (!snap.exists) {
    throw new ValidationError('Invalid or expired discount code');
  }

  const couponDoc = snap.data() as CouponRecord;
  const targetRef = discountRef;

  // DISC-1: Check active status
  if (!couponDoc.active) {
    throw new ValidationError('Invalid or expired discount code');
  }

  // DISC-1: Date checks
  const nowMs = Date.now();
  if (couponDoc.startDate && new Date(couponDoc.startDate).getTime() > nowMs) {
    throw new ValidationError('Invalid or expired discount code');
  }
  if (couponDoc.endDate && new Date(couponDoc.endDate).getTime() < nowMs) {
    throw new ValidationError('Invalid or expired discount code');
  }
  if (couponDoc.expiresAt && new Date(couponDoc.expiresAt).getTime() < nowMs) {
    throw new ValidationError('Invalid or expired discount code');
  }

  // DISC-4: Guest checks
  const isGuest = !userId;
  if (isGuest && couponDoc.guestAllowed === false) {
    throw new ValidationError('This discount code requires an account. Please sign in to apply.');
  }

  // DISC-1: Minimum spend requirement
  if (couponDoc.minSpendPaise && subtotalPaise < couponDoc.minSpendPaise) {
    throw new ValidationError(`Minimum order value of ₹${couponDoc.minSpendPaise / 100} required for this code`);
  }

  // DISC-2: Global usage limit check
  const usedCount = couponDoc.usedCount || 0;
  if (couponDoc.maxUses && usedCount >= couponDoc.maxUses) {
    throw new ValidationError('This discount code has reached its maximum total uses');
  }

  // DISC-2, DISC-3: Per-user usage limit check
  const userIdentifier = userId || (phone ? `PHONE_${phone.replace(/\D/g, '')}` : null);
  if (userIdentifier && couponDoc.maxUsesPerUser) {
    const redemptionsQuery = await transaction.get(
      db.collection('redemptions')
        .where('code', '==', cleanCode)
        .where('userIdentifier', '==', userIdentifier)
        .limit(couponDoc.maxUsesPerUser + 1)
    );

    if (redemptionsQuery.size >= couponDoc.maxUsesPerUser) {
      throw new ValidationError(`You have already used this discount code the maximum allowed number of times`);
    }
  }

  // Calculate discount amount in paise
  let discountPaise = 0;
  if (couponDoc.type === 'PERCENT') {
    discountPaise = Math.floor((subtotalPaise * couponDoc.value) / 100);
  } else if (couponDoc.type === 'FLAT_PAISE') {
    discountPaise = Math.min(couponDoc.value, subtotalPaise);
  }

  // DISC-2: Atomic creation of redemptions/{code}_{orderId}
  const redemptionId = `${cleanCode}_${orderId}`;
  const redemptionRef = db.collection('redemptions').doc(redemptionId);
  transaction.set(redemptionRef, {
    code: cleanCode,
    orderId,
    userId: userId || null,
    userIdentifier: userIdentifier || null,
    discountPaise,
    status: 'ACTIVE',
    redeemedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Increment coupon usage counter
  transaction.update(targetRef, {
    usedCount: admin.firestore.FieldValue.increment(1)
  });

  logger.info('Coupon successfully validated and redeemed in order transaction', {
    code: cleanCode,
    orderId,
    discountPaise
  });

  return {
    discountPaise,
    code: cleanCode
  };
}

/**
 * Releases redemption if order is cancelled or expired without payment. (DISC-3)
 */
export async function releaseCouponRedemptionInTransaction(
  transaction: admin.firestore.Transaction,
  code: string,
  orderId: string
): Promise<void> {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) return;

  const redemptionId = `${cleanCode}_${orderId}`;
  const redemptionRef = db.collection('redemptions').doc(redemptionId);
  const redemptionSnap = await transaction.get(redemptionRef);

  if (redemptionSnap.exists && redemptionSnap.data()?.status === 'ACTIVE') {
    transaction.update(redemptionRef, {
      status: 'RELEASED',
      releasedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Decrement discount usedCount
    const discountRef = db.collection('discounts').doc(cleanCode);
    const discountSnap = await transaction.get(discountRef);
    if (discountSnap.exists) {
      transaction.update(discountRef, {
        usedCount: admin.firestore.FieldValue.increment(-1)
      });
    }

    logger.info('Coupon redemption released back to available pool', { code: cleanCode, orderId });
  }
}
