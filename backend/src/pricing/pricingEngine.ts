/**
 * Satvik Swaad — Authoritative Pricing & Delivery Engine
 * Authority: docs/SPEC.md Section 7 (PRICE-1 to PRICE-9, DISC-1 to DISC-5)
 *
 * Rules:
 * - PRICE-1: Server calculates all prices, discounts, delivery fees, and taxes.
 * - PRICE-2: Orders > ₹25,000 flagged for manual review hold (needsReview = true).
 * - PRICE-3: Delivery fee calculated strictly by pincode lookup (never city/state text).
 * - PRICE-4: Free delivery when (subtotal - discount) >= ₹499 (49,900 paise).
 * - PRICE-5: Deoria local zone (pincode 274001) gets ₹0 delivery fee.
 * - PRICE-6: Standard delivery fee is ₹50 (5,000 paise).
 * - PRICE-7: Quote lifetime is 15 minutes.
 * - PRICE-8: Tax calculated per variant, rounded half-up to nearest paisa per line.
 * - PRICE-9: Immutable line snapshots stored with order.
 */

import { assertNonNegativePaise, roundTaxPaise, CONFIG_LIMITS } from '../shared';

export interface OrderLineInput {
  productId: string;
  variantId: string;
  title: string;
  unitPricePaise: number;
  qty: number;
  taxRatePercent: number; // e.g. 12 for 12% GST, 5 for 5% GST
  hsn: string;
}

export interface FrozenOrderLine extends OrderLineInput {
  lineTotalPaise: number;
  taxPaise: number;
}

export interface PricingInput {
  items: OrderLineInput[];
  pincode: string;
  discountCodeDoc?: DiscountDoc | null;
}

export interface PricedOrderSummary {
  lines: FrozenOrderLine[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  needsReview: boolean;
  quoteExpiresAt: Date;
}

export interface DiscountDoc {
  code: string;
  type: 'PERCENT' | 'FLAT_PAISE';
  value: number; // e.g. 10 for 10%, or 5000 for ₹50
  active: boolean;
  minSpendPaise?: number;
  maxUses?: number;
  usedCount?: number;
  expiresAt?: string;
}

/**
 * Calculates delivery fee strictly by destination pincode. (PRICE-3, PRICE-4, PRICE-5, PRICE-6)
 */
export function calculateDeliveryFeePaise(pincode: string, netSubtotalPaise: number): number {
  assertNonNegativePaise(netSubtotalPaise);
  const cleanPincode = (pincode || '').trim();

  // Deoria Local Delivery Zone (PRICE-5)
  if (cleanPincode === '274001') {
    return 0;
  }

  // Non-Local: Free delivery if net subtotal >= ₹499 (PRICE-4)
  if (netSubtotalPaise >= CONFIG_LIMITS.freeShipPaise) {
    return 0;
  }

  // Standard non-local delivery fee ₹50 (PRICE-6)
  return CONFIG_LIMITS.shippingFeePaise;
}

/**
 * Calculates line tax rounded half-up to nearest paisa. (PRICE-8, MONEY-5)
 */
export function calculateLineTaxPaise(lineTotalPaise: number, taxRatePercent: number): number {
  assertNonNegativePaise(lineTotalPaise);
  if (taxRatePercent <= 0) return 0;
  const rawTax = (lineTotalPaise * taxRatePercent) / 100;
  return roundTaxPaise(rawTax);
}

/**
 * Validates a discount coupon and returns the discount in paise. (DISC-1 to DISC-5)
 */
export function validateDiscountCode(
  discount: DiscountDoc | null | undefined,
  subtotalPaise: number
): { valid: boolean; discountPaise: number; reason?: string } {
  if (!discount || !discount.active) {
    return { valid: false, discountPaise: 0, reason: 'Coupon inactive or not found' };
  }

  if (discount.expiresAt && new Date(discount.expiresAt).getTime() < Date.now()) {
    return { valid: false, discountPaise: 0, reason: 'Coupon expired' };
  }

  if (discount.maxUses && (discount.usedCount || 0) >= discount.maxUses) {
    return { valid: false, discountPaise: 0, reason: 'Coupon usage limit reached' };
  }

  if (discount.minSpendPaise && subtotalPaise < discount.minSpendPaise) {
    return {
      valid: false,
      discountPaise: 0,
      reason: `Minimum spend of ₹${discount.minSpendPaise / 100} required`
    };
  }

  let discountPaise = 0;
  if (discount.type === 'PERCENT') {
    discountPaise = Math.floor((subtotalPaise * discount.value) / 100);
  } else if (discount.type === 'FLAT_PAISE') {
    discountPaise = Math.min(discount.value, subtotalPaise);
  }

  return { valid: true, discountPaise };
}

/**
 * Authoritative single pricing calculation for quotes and orders. (PRICE-1 to PRICE-9)
 */
export function priceOrder(input: PricingInput): PricedOrderSummary {
  let subtotalPaise = 0;
  let totalTaxPaise = 0;

  const lines: FrozenOrderLine[] = input.items.map((item) => {
    assertNonNegativePaise(item.unitPricePaise);
    const lineTotalPaise = item.unitPricePaise * item.qty;
    const taxPaise = calculateLineTaxPaise(lineTotalPaise, item.taxRatePercent);

    subtotalPaise += lineTotalPaise;
    totalTaxPaise += taxPaise;

    return {
      ...item,
      lineTotalPaise,
      taxPaise
    };
  });

  // Calculate discount
  let discountPaise = 0;
  if (input.discountCodeDoc) {
    const discResult = validateDiscountCode(input.discountCodeDoc, subtotalPaise);
    if (discResult.valid) {
      discountPaise = discResult.discountPaise;
    }
  }

  const netSubtotalPaise = Math.max(0, subtotalPaise - discountPaise);
  const shippingPaise = calculateDeliveryFeePaise(input.pincode, netSubtotalPaise);
  const totalPaise = netSubtotalPaise + shippingPaise;

  // PRICE-2: Flag high-value orders above ₹25,000 for manual review hold
  const needsReview = subtotalPaise > CONFIG_LIMITS.reviewHoldPaise;

  // PRICE-7: Quote validity 15 minutes
  const quoteExpiresAt = new Date(Date.now() + CONFIG_LIMITS.reserveOnlineMinutes * 60 * 1000);

  return {
    lines,
    subtotalPaise,
    discountPaise,
    shippingPaise,
    taxPaise: totalTaxPaise,
    totalPaise,
    needsReview,
    quoteExpiresAt
  };
}
