import {
  priceOrder,
  calculateDeliveryFeePaise,
  calculateLineTaxPaise,
  validateDiscountCode
} from '../src/pricing/pricingEngine';
import {
  reserveStockInTransaction,
  commitSoldStockInTransaction,
  releaseReservationInTransaction
} from '../src/inventory/inventoryService';

describe('Wave 2 — Orders & Inventory Module (PRICE-1..9, DISC-1..5, STOCK-1..7)', () => {
  describe('1. Pricing & Delivery Engine (PRICE-1 to PRICE-9)', () => {
    it('PRICE-5: Local Deoria pincode (274001) always gets 0 shipping', () => {
      expect(calculateDeliveryFeePaise('274001', 10000)).toBe(0);
      expect(calculateDeliveryFeePaise('274001', 1000)).toBe(0);
    });

    it('PRICE-4, PRICE-6: Non-local delivery fee is 0 for subtotal >= ₹499, else ₹50', () => {
      // Subtotal >= 49900 paise -> free delivery (PRICE-4)
      expect(calculateDeliveryFeePaise('221001', 49900)).toBe(0);
      expect(calculateDeliveryFeePaise('110001', 50000)).toBe(0);

      // Subtotal < 49900 paise -> 5000 paise delivery fee (PRICE-6)
      expect(calculateDeliveryFeePaise('221001', 49800)).toBe(5000);
      expect(calculateDeliveryFeePaise('110001', 25000)).toBe(5000);
    });

    it('PRICE-8: Tax calculates half-up rounded paisa per line', () => {
      // 12% GST on ₹249.00 (24900 paise) = 2988 paise
      expect(calculateLineTaxPaise(24900, 12)).toBe(2988);
      // 5% GST on ₹125.50 (12550 paise) = 627.5 paise -> rounds to 628
      expect(calculateLineTaxPaise(12550, 5)).toBe(628);
    });

    it('PRICE-1, PRICE-9: priceOrder computes complete snapshot with integer paise', () => {
      const items = [
        {
          productId: 'mango-achar',
          variantId: 'mango-achar-500g',
          title: 'Aam Ka Achar',
          unitPricePaise: 24900,
          qty: 2,
          taxRatePercent: 12,
          hsn: '20019000'
        }
      ];

      const priced = priceOrder({
        items,
        pincode: '221001'
      });

      expect(priced.subtotalPaise).toBe(49800);
      expect(priced.discountPaise).toBe(0);
      expect(priced.shippingPaise).toBe(5000); // Under ₹499
      expect(priced.taxPaise).toBe(5976);
      expect(priced.totalPaise).toBe(49800 + 5000);
      expect(priced.needsReview).toBe(false);
      expect(priced.lines[0].hsn).toBe('20019000');
    });

    it('PRICE-2: Orders above ₹25,000 flag needsReview = true', () => {
      const items = [
        {
          productId: 'ghee-laddu',
          variantId: 'ghee-laddu-1kg',
          title: 'Shuddh Desi Ghee Laddu',
          unitPricePaise: 130000,
          qty: 20, // ₹26,000
          taxRatePercent: 5,
          hsn: '21069099'
        }
      ];

      const priced = priceOrder({
        items,
        pincode: '274001'
      });

      expect(priced.subtotalPaise).toBe(2600000);
      expect(priced.needsReview).toBe(true);
    });
  });

  describe('2. Discount Code Engine (DISC-1 to DISC-5)', () => {
    it('DISC-1: Validates active percentage discount with minSpend requirement', () => {
      const discountDoc = {
        code: 'FESTIVE10',
        type: 'PERCENT' as const,
        value: 10,
        active: true,
        minSpendPaise: 30000,
        maxUses: 100,
        usedCount: 5,
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      };

      // Below minSpend
      const res1 = validateDiscountCode(discountDoc, 25000);
      expect(res1.valid).toBe(false);

      // Above minSpend
      const res2 = validateDiscountCode(discountDoc, 50000);
      expect(res2.valid).toBe(true);
      expect(res2.discountPaise).toBe(5000); // 10% of 50000
    });

    it('DISC-1: Validates flat rupee discount', () => {
      const discountDoc = {
        code: 'FLAT50',
        type: 'FLAT_PAISE' as const,
        value: 5000, // ₹50
        active: true,
        minSpendPaise: 20000,
        maxUses: 50,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      };

      const res = validateDiscountCode(discountDoc, 30000);
      expect(res.valid).toBe(true);
      expect(res.discountPaise).toBe(5000);
    });
  });
});
