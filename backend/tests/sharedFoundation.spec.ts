import {
  formatRupees,
  assertPaise,
  assertNonNegativePaise,
  roundTaxPaise,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  CHANNELS,
  PAYMENT_METHODS,
  CONFIG_LIMITS,
  generateOrderId,
  generatePayuTxnId,
  generateGuestToken,
  isValidTransition,
  getNextValidOrderStatuses,
  getNextValidPaymentStatuses,
  validateOrderCreationPayload,
  TransitionError
} from '../../shared';

describe('Wave 1 — Shared Foundation & Domain Rules (Architect)', () => {
  describe('1. Money Rules (MONEY-1 to MONEY-6)', () => {
    it('MONEY-3: formatRupees converts paise to exact 2-decimal rupee string without commas', () => {
      expect(formatRupees(49900)).toBe('499.00');
      expect(formatRupees(0)).toBe('0.00');
      expect(formatRupees(50)).toBe('0.50');
      expect(formatRupees(5)).toBe('0.05');
      expect(formatRupees(123456789)).toBe('1234567.89');
    });

    it('MONEY-1: assertPaise rejects non-integers and non-numbers', () => {
      expect(() => assertPaise(499.50)).toThrow(/integer/i);
      expect(() => assertPaise(NaN)).toThrow();
      expect(() => assertPaise(Infinity)).toThrow();
      const nonNumber: any = '49900';
      expect(() => assertPaise(nonNumber)).toThrow();
      expect(() => assertPaise(100)).not.toThrow();
    });

    it('MONEY-1: assertNonNegativePaise rejects negative values', () => {
      expect(() => assertNonNegativePaise(-1)).toThrow(/negative/i);
      expect(() => assertNonNegativePaise(0)).not.toThrow();
      expect(() => assertNonNegativePaise(5000)).not.toThrow();
    });

    it('MONEY-5: roundTaxPaise rounds half-up to nearest paisa', () => {
      expect(roundTaxPaise(12.4)).toBe(12);
      expect(roundTaxPaise(12.5)).toBe(13);
      expect(roundTaxPaise(12.6)).toBe(13);
      expect(roundTaxPaise(0)).toBe(0);
    });

    it('MONEY-6: validateOrderCreationPayload rejects client-supplied financial fields with HTTP 400', () => {
      const maliciousPayloads = [
        { price: 100, items: [{ variantId: 'achar-500g', qty: 1 }] },
        { totalPaise: 49900, items: [{ variantId: 'achar-500g', qty: 1 }] },
        { subtotalPaise: 49900, items: [{ variantId: 'achar-500g', qty: 1 }] },
        { shippingPaise: 5000, items: [{ variantId: 'achar-500g', qty: 1 }] },
        { discountPaise: 1000, items: [{ variantId: 'achar-500g', qty: 1 }] },
        { items: [{ variantId: 'achar-500g', qty: 1, price: 100 }] }
      ];

      for (const payload of maliciousPayloads) {
        const result = validateOrderCreationPayload(payload);
        expect(result.valid).toBe(false);
        expect(result.statusCode).toBe(400);
      }
    });
  });

  describe('2. Canonical Enums & Constants (Section 2.3, 2.4, 20.2)', () => {
    it('Contains exact 8 orderStatus values', () => {
      expect(ORDER_STATUSES).toEqual([
        'PLACED',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'EXPIRED',
        'RETURNED'
      ]);
    });

    it('Contains exact 10 paymentStatus values', () => {
      expect(PAYMENT_STATUSES).toEqual([
        'UNPAID',
        'PENDING_VERIFICATION',
        'PAID',
        'FAILED',
        'COD_DUE',
        'COD_COLLECTED',
        'REFUND_PENDING',
        'PARTIALLY_REFUNDED',
        'REFUNDED',
        'DISPUTED'
      ]);
    });

    it('Contains exact 5 channels', () => {
      expect(CHANNELS).toEqual([
        'ONLINE',
        'OFFLINE_COUNTER',
        'OFFLINE_PHONE',
        'OFFLINE_EVENT',
        'WHATSAPP'
      ]);
    });

    it('Contains exact 6 paymentMethods', () => {
      expect(PAYMENT_METHODS).toEqual([
        'PAYU',
        'RAZORPAY',
        'UPI_MANUAL',
        'COD',
        'CASH',
        'UPI_COUNTER'
      ]);
    });

    it('Reflects Section 20.2 dynamic configuration defaults', () => {
      expect(CONFIG_LIMITS.refundApprovalPaise).toBe(200000);
      expect(CONFIG_LIMITS.refundApprovalCount).toBe(3);
      expect(CONFIG_LIMITS.codMaxPaise).toBe(300000);
      expect(CONFIG_LIMITS.upiMaxPaise).toBe(200000);
      expect(CONFIG_LIMITS.reviewHoldPaise).toBe(2500000);
      expect(CONFIG_LIMITS.freeShipPaise).toBe(49900);
      expect(CONFIG_LIMITS.shippingFeePaise).toBe(5000);
      expect(CONFIG_LIMITS.staffDiscountPercent).toBe(5);
      expect(CONFIG_LIMITS.staffDiscountMaxPaise).toBe(10000);
      expect(CONFIG_LIMITS.lowStockUnits).toBe(5);
      expect(CONFIG_LIMITS.reserveOnlineMinutes).toBe(15);
      expect(CONFIG_LIMITS.reserveSlowMinutes).toBe(120);
      expect(CONFIG_LIMITS.reserveCodMinutes).toBe(30);
      expect(CONFIG_LIMITS.stepUpSeconds).toBe(300);
      expect(CONFIG_LIMITS.adminIdleMinutes).toBe(30);
    });
  });

  describe('3. Cryptographic ID Formats (Section 2.2)', () => {
    it('generateOrderId creates SS- + 12 Crockford base32 characters', () => {
      const id1 = generateOrderId();
      const id2 = generateOrderId();
      expect(id1).toMatch(/^SS-[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{12}$/);
      expect(id2).toMatch(/^SS-[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{12}$/);
      expect(id1).not.toBe(id2);
    });

    it('generatePayuTxnId creates ss + 20 lowercase base32 characters (22 total)', () => {
      const txnid1 = generatePayuTxnId();
      const txnid2 = generatePayuTxnId();
      expect(txnid1).toMatch(/^ss[0-9a-z]{20}$/);
      expect(txnid1.length).toBe(22);
      expect(txnid1).not.toBe(txnid2);
    });

    it('generateGuestToken creates 32-byte base64url token and SHA-256 hash', () => {
      const { token, hash } = generateGuestToken();
      expect(token).toBeDefined();
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('4. State Machine Enforcement (STATE-1 to STATE-6, Section 4)', () => {
    it('STATE-1: Whitelist permits valid forward transitions for orderStatus', () => {
      expect(isValidTransition('order', 'PLACED', 'CONFIRMED')).toBe(true);
      expect(isValidTransition('order', 'CONFIRMED', 'PROCESSING')).toBe(true);
      expect(isValidTransition('order', 'PROCESSING', 'SHIPPED')).toBe(true);
      expect(isValidTransition('order', 'SHIPPED', 'DELIVERED')).toBe(true);
    });

    it('STATE-1: Whitelist permits valid cancellation & return transitions', () => {
      expect(isValidTransition('order', 'PLACED', 'CANCELLED')).toBe(true);
      expect(isValidTransition('order', 'CONFIRMED', 'CANCELLED')).toBe(true);
      expect(isValidTransition('order', 'PROCESSING', 'CANCELLED')).toBe(true);
      expect(isValidTransition('order', 'SHIPPED', 'RETURNED')).toBe(true);
      expect(isValidTransition('order', 'DELIVERED', 'RETURNED')).toBe(true);
      expect(isValidTransition('order', 'PLACED', 'EXPIRED')).toBe(true);
    });

    it('STATE-5: Terminal order states reject illegal transitions', () => {
      expect(isValidTransition('order', 'CANCELLED', 'CONFIRMED')).toBe(false);
      expect(isValidTransition('order', 'DELIVERED', 'PROCESSING')).toBe(false);
      expect(isValidTransition('order', 'RETURNED', 'DELIVERED')).toBe(false);
    });

    it('Section 4.3: EXPIRED -> CONFIRMED is permitted only for late-payment revival', () => {
      expect(isValidTransition('order', 'EXPIRED', 'CONFIRMED')).toBe(true);
      expect(isValidTransition('order', 'EXPIRED', 'PROCESSING')).toBe(false);
    });

    it('STATE-4: Same-state transition is idempotent (valid no-op)', () => {
      expect(isValidTransition('order', 'PLACED', 'PLACED')).toBe(true);
      expect(isValidTransition('order', 'CONFIRMED', 'CONFIRMED')).toBe(true);
      expect(isValidTransition('payment', 'PAID', 'PAID')).toBe(true);
    });

    it('Payment status whitelist validates legal payment flows', () => {
      expect(isValidTransition('payment', 'UNPAID', 'PAID')).toBe(true);
      expect(isValidTransition('payment', 'UNPAID', 'PENDING_VERIFICATION')).toBe(true);
      expect(isValidTransition('payment', 'PENDING_VERIFICATION', 'PAID')).toBe(true);
      expect(isValidTransition('payment', 'UNPAID', 'COD_DUE')).toBe(true);
      expect(isValidTransition('payment', 'COD_DUE', 'COD_COLLECTED')).toBe(true);
      expect(isValidTransition('payment', 'PAID', 'REFUND_PENDING')).toBe(true);
      expect(isValidTransition('payment', 'REFUND_PENDING', 'REFUNDED')).toBe(true);
      expect(isValidTransition('payment', 'REFUNDED', 'PAID')).toBe(false);
    });
  });
});
