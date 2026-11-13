/**
 * Satvik Swaad — Canonical Enums & Configuration Constants
 * Authority: docs/SPEC.md Section 2.3, 2.4, and 20.2
 *
 * Rules:
 * - One name per concept, one format per value (Section 2)
 * - Zero deviation from specification strings
 */

export const ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'EXPIRED',
  'RETURNED'
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
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
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const CHANNELS = [
  'ONLINE',
  'OFFLINE_COUNTER',
  'OFFLINE_PHONE',
  'OFFLINE_EVENT',
  'WHATSAPP'
] as const;

export type Channel = (typeof CHANNELS)[number];

export const PAYMENT_METHODS = [
  'PAYU',
  'RAZORPAY',
  'UPI_MANUAL',
  'COD',
  'CASH',
  'UPI_COUNTER'
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Dynamic configuration limits from docs/SPEC.md Section 20.2
 * All monetary amounts are integer paise.
 */
export const CONFIG_LIMITS = {
  refundApprovalPaise: 200000, // Above ₹2,000 needs 2nd approval (REFUND-3)
  refundApprovalCount: 3,      // 3rd refund in 24h needs 2nd approval (REFUND-3)
  codMaxPaise: 300000,         // COD maximum ₹3,000 (COD-1)
  upiMaxPaise: 200000,         // Manual UPI maximum ₹2,000 (UPI-2)
  reviewHoldPaise: 2500000,    // Online order hold threshold ₹25,000 (PRICE-2)
  freeShipPaise: 49900,        // Free delivery threshold ₹499 (Section 7.2)
  shippingFeePaise: 5000,      // Standard shipping fee ₹50 (Section 7.2)
  staffDiscountPercent: 5,     // Lower of 5% or ₹100 per sale (POS-3)
  staffDiscountMaxPaise: 10000,// Max staff POS discount ₹100 (POS-3)
  lowStockUnits: 5,            // Low-stock alert threshold (STOCK-3)
  reserveOnlineMinutes: 15,    // Online gateway reservation hold (Section 8.4)
  reserveSlowMinutes: 120,     // Manual UPI & WhatsApp reservation hold (Section 8.4)
  reserveCodMinutes: 30,       // COD confirmation reservation hold (Section 8.4)
  quoteTtlMinutes: 10,         // Quotes API TTL 10 minutes (Decision D16)
  stepUpSeconds: 300,          // Step-up re-authentication window (AUTH-5)
  adminIdleMinutes: 30         // Admin idle session timeout (AUTH-7)
} as const;
