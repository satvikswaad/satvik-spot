/**
 * Satvik Swaad — Canonical Request Validation & Tamper Protection Schemas
 * Authority: docs/SPEC.md Section 2.1 (MONEY-6), Section 7.1 (PRICE-1), Section 10
 *
 * Rules:
 * - MONEY-6: The browser never sends a price, subtotal, shipping fee, discount amount or total.
 *   Any such field in a request body is rejected with HTTP 400, not ignored.
 * - PRICE-1: Client may send only variant IDs and quantities.
 */

// Forbidden financial/status fields that MUST NOT appear anywhere in client request payloads
const FORBIDDEN_CLIENT_FIELDS = [
  'price',
  'unitPrice',
  'lineTotal',
  'subtotal',
  'subtotalPaise',
  'shipping',
  'shippingFee',
  'shippingPaise',
  'discount',
  'discountPaise',
  'tax',
  'taxPaise',
  'total',
  'totalPaise',
  'amount',
  'amountPaise',
  'status',
  'orderStatus',
  'paymentStatus',
  'role',
  'isAdmin',
  'userId'
] as const;

export interface ValidationResult {
  valid: boolean;
  statusCode?: number;
  error?: string;
  field?: string;
}

/**
 * Deep inspection of client request payloads to detect and reject tampered financial parameters.
 * Rejects with HTTP 400 immediately upon detecting client price/total fields. (MONEY-6)
 */
export function validateOrderCreationPayload(payload: unknown): ValidationResult {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, statusCode: 400, error: 'Payload must be a non-empty object' };
  }

  const obj = payload as Record<string, unknown>;

  // Check top-level forbidden keys
  for (const forbidden of FORBIDDEN_CLIENT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(obj, forbidden)) {
      return {
        valid: false,
        statusCode: 400,
        error: `Client payload contains forbidden field: '${forbidden}'. Prices and totals must be computed by the server only.`,
        field: forbidden
      };
    }
  }

  // Check items array
  if (!Array.isArray(obj.items) || obj.items.length === 0) {
    return { valid: false, statusCode: 400, error: 'Order must contain at least one item' };
  }

  for (let i = 0; i < obj.items.length; i++) {
    const item = obj.items[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { valid: false, statusCode: 400, error: `Invalid item at index ${i}` };
    }

    const itemObj = item as Record<string, unknown>;
    for (const forbidden of FORBIDDEN_CLIENT_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(itemObj, forbidden)) {
        return {
          valid: false,
          statusCode: 400,
          error: `Item at index ${i} contains forbidden field: '${forbidden}'. Client price injection rejected.`,
          field: `items[${i}].${forbidden}`
        };
      }
    }

    // Validate variantId or productId
    if (!itemObj.variantId && !itemObj.productId) {
      return { valid: false, statusCode: 400, error: `Item at index ${i} requires variantId or productId` };
    }

    // Validate qty
    const qty = itemObj.qty;
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > 10) {
      return { valid: false, statusCode: 400, error: `Item at index ${i} quantity must be an integer between 1 and 10` };
    }
  }

  return { valid: true };
}
