import {
  generateInvoiceNumber,
  validatePosDiscount,
  createPosSaleRecord,
  voidPosSaleRecord,
  validateRefundAuthorization,
  validatePriceChangeConfirmation,
  paginateWithCursor
} from '../src/admin/adminErpPosService';

describe('Wave 3 — Admin ERP & POS Module (POS-1..8, REFUND-1..5, ADMINPRICE-1..3, UI-3)', () => {
  describe('1. POS Counter Sale & Invoices (POS-1 to POS-8, TAX-3)', () => {
    it('POS-3: Staff discount is capped at the lower of 5% and ₹100 (10,000 paise)', () => {
      // For subtotal ₹1,000 (100,000 paise): 5% is ₹50 (5,000 paise), which is < ₹100.
      // Maximum allowed for staff is 5,000 paise.
      expect(validatePosDiscount('staff', 100000, 5000)).toEqual({ valid: true });
      expect(validatePosDiscount('staff', 100000, 6000)).toEqual({
        valid: false,
        error: 'STAFF_DISCOUNT_EXCEEDED'
      });

      // For subtotal ₹3,000 (300,000 paise): 5% is ₹150, but cap is ₹100 (10,000 paise).
      // Maximum allowed for staff is 10,000 paise.
      expect(validatePosDiscount('staff', 300000, 10000)).toEqual({ valid: true });
      expect(validatePosDiscount('staff', 300000, 11000)).toEqual({
        valid: false,
        error: 'STAFF_DISCOUNT_EXCEEDED'
      });
    });

    it('POS-3: Owner may apply any discount with written reason', () => {
      expect(validatePosDiscount('owner', 100000, 50000, 'Festival giveaway')).toEqual({ valid: true });
      expect(validatePosDiscount('owner', 100000, 50000)).toEqual({
        valid: false,
        error: 'OWNER_REASON_REQUIRED'
      });
    });

    it('TAX-3, POS-6: Formats sequential financial year invoice SS/YY-YY/XXXXXX', () => {
      // 1st invoice in FY 2026-2027
      const inv1 = generateInvoiceNumber('26-27', 1);
      expect(inv1).toBe('SS/26-27/000001');

      // 123rd invoice
      const inv123 = generateInvoiceNumber('26-27', 123);
      expect(inv123).toBe('SS/26-27/000123');
    });

    it('POS-1: Rejects POS sale creation if caller lacks staff or owner role', async () => {
      const result = await createPosSaleRecord({
        actorRole: 'customer',
        actorId: 'cust_123',
        subtotalPaise: 50000,
        discountPaise: 0,
        items: [{ variantId: 'achar-500g', qty: 1 }]
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('UNAUTHORIZED_POS_ROLE');
    });

    it('POS-5: Void requires owner role and step-up authentication', async () => {
      // Staff cannot void
      const staffVoid = await voidPosSaleRecord({
        actorRole: 'staff',
        actorId: 'staff_1',
        saleId: 'SS-POS-001',
        authTimestampSeconds: Math.floor(Date.now() / 1000) - 50,
        reason: 'Typo'
      });
      expect(staffVoid.success).toBe(false);
      expect(staffVoid.error).toBe('OWNER_ROLE_REQUIRED_FOR_VOID');

      // Owner with expired step-up (> 300s) cannot void
      const expiredVoid = await voidPosSaleRecord({
        actorRole: 'owner',
        actorId: 'owner_1',
        saleId: 'SS-POS-001',
        authTimestampSeconds: Math.floor(Date.now() / 1000) - 350,
        reason: 'Customer cancelled'
      });
      expect(expiredVoid.success).toBe(false);
      expect(expiredVoid.error).toBe('STEP_UP_REQUIRED');
    });
  });

  describe('2. Dual Admin Refund Authorization (REFUND-1 to REFUND-5)', () => {
    it('REFUND-3: Refund <= ₹2,000 (200,000 paise) within 2 refunds/24h requires only single admin approval', () => {
      const auth = validateRefundAuthorization({
        refundPaise: 150000, // ₹1,500
        admin24hRefundCount: 1,
        isSecondAdminApproved: false
      });

      expect(auth.permitted).toBe(true);
      expect(auth.needsSecondApproval).toBe(false);
    });

    it('REFUND-3: Refund > ₹2,000 requires second admin/owner approval', () => {
      // Without second approval
      const authPending = validateRefundAuthorization({
        refundPaise: 250000, // ₹2,500
        admin24hRefundCount: 1,
        isSecondAdminApproved: false
      });
      expect(authPending.permitted).toBe(false);
      expect(authPending.needsSecondApproval).toBe(true);

      // With second approval
      const authApproved = validateRefundAuthorization({
        refundPaise: 250000,
        admin24hRefundCount: 1,
        isSecondAdminApproved: true
      });
      expect(authApproved.permitted).toBe(true);
    });

    it('REFUND-3: 3rd refund in 24 hours by same admin requires second approval regardless of amount', () => {
      const auth = validateRefundAuthorization({
        refundPaise: 50000, // ₹500
        admin24hRefundCount: 3, // 3rd refund
        isSecondAdminApproved: false
      });

      expect(auth.permitted).toBe(false);
      expect(auth.needsSecondApproval).toBe(true);
    });
  });

  describe('3. Price Modification Double Confirmation (ADMINPRICE-1 to ADMINPRICE-3)', () => {
    it('ADMINPRICE-2: Price change <= 50% does not require second confirmation', () => {
      // ₹200 to ₹250 (25% increase)
      const res = validatePriceChangeConfirmation(20000, 25000, false);
      expect(res.allowed).toBe(true);
      expect(res.needsConfirmation).toBe(false);
    });

    it('ADMINPRICE-2: Price change > 50% requires explicit double confirmation', () => {
      // ₹200 to ₹350 (75% increase) without confirmation
      const res1 = validatePriceChangeConfirmation(20000, 35000, false);
      expect(res1.allowed).toBe(false);
      expect(res1.needsConfirmation).toBe(true);
      expect(res1.error).toBe('PRICE_CHANGE_CONFIRMATION_REQUIRED');

      // ₹200 to ₹350 with double confirmation
      const res2 = validatePriceChangeConfirmation(20000, 35000, true);
      expect(res2.allowed).toBe(true);
      expect(res2.needsConfirmation).toBe(false);

      // ₹200 to ₹80 (60% drop) without confirmation
      const res3 = validatePriceChangeConfirmation(20000, 8000, false);
      expect(res3.allowed).toBe(false);
      expect(res3.needsConfirmation).toBe(true);
    });
  });

  describe('4. Cursor-Based Admin Pagination (UI-3)', () => {
    it('UI-3: Paginates collection with default 25 items per view', () => {
      const mockItems = Array.from({ length: 60 }, (_, i) => ({
        id: `ord_${i + 1}`,
        createdAt: 1000 + i
      }));

      const page1 = paginateWithCursor(mockItems, 25);
      expect(page1.items.length).toBe(25);
      expect(page1.hasMore).toBe(true);
      expect(page1.nextCursor).toBe('ord_25');

      const page2 = paginateWithCursor(mockItems.slice(25), 25);
      expect(page2.items.length).toBe(25);
      expect(page2.hasMore).toBe(true);

      const page3 = paginateWithCursor(mockItems.slice(50), 25);
      expect(page3.items.length).toBe(10);
      expect(page3.hasMore).toBe(false);
      expect(page3.nextCursor).toBeNull();
    });
  });
});
