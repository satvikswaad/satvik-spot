/**
 * Satvik Swaad — Admin ERP & Point-of-Sale Service
 * Authority: docs/SPEC.md Section 6.5 (POS-1..8), Section 5.6 (REFUND-1..5),
 * Section 7.3 (ADMINPRICE-1..3), Section 12.3 (UI-3), Section 18 (TAX-3)
 */

import { assertStepUpFreshness } from '../shared/stateMachine';

export const POS_STAFF_DISCOUNT_PERCENT = 0.05; // 5%
export const POS_STAFF_DISCOUNT_CAP_PAISE = 10000; // ₹100
export const DUAL_REFUND_THRESHOLD_PAISE = 200000; // ₹2,000
export const DUAL_REFUND_COUNT_THRESHOLD = 3; // 3rd refund in 24h

export interface PosDiscountValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates staff vs owner POS discount rules (POS-3)
 */
export function validatePosDiscount(
  role: string,
  subtotalPaise: number,
  discountPaise: number,
  reason?: string
): PosDiscountValidationResult {
  if (discountPaise <= 0) {
    return { valid: true };
  }

  if (role === 'staff') {
    // Lower of 5% and ₹100
    const percentCap = Math.floor(subtotalPaise * POS_STAFF_DISCOUNT_PERCENT);
    const maxAllowed = Math.min(percentCap, POS_STAFF_DISCOUNT_CAP_PAISE);

    if (discountPaise > maxAllowed) {
      return {
        valid: false,
        error: 'STAFF_DISCOUNT_EXCEEDED'
      };
    }
    return { valid: true };
  }

  if (role === 'owner' || role === 'admin_owner') {
    if (!reason || reason.trim().length === 0) {
      return {
        valid: false,
        error: 'OWNER_REASON_REQUIRED'
      };
    }
    if (discountPaise > subtotalPaise) {
      return {
        valid: false,
        error: 'DISCOUNT_EXCEEDS_SUBTOTAL'
      };
    }
    return { valid: true };
  }

  return {
    valid: false,
    error: 'UNAUTHORIZED_DISCOUNT_ROLE'
  };
}

/**
 * Sequential financial year invoice generator (TAX-3, POS-6)
 * Format: SS/YY-YY/XXXXXX
 */
export function generateInvoiceNumber(financialYear: string, sequenceNumber: number): string {
  const padded = String(sequenceNumber).padStart(6, '0');
  return `SS/${financialYear}/${padded}`;
}

export interface PosSaleItem {
  variantId: string;
  qty: number;
}

export interface CreatePosSaleParams {
  actorRole: string;
  actorId: string;
  subtotalPaise: number;
  discountPaise: number;
  items: PosSaleItem[];
  discountReason?: string;
  occurredAt?: string; // POS-7 late entry
}

export interface CreatePosSaleResult {
  success: boolean;
  saleId?: string;
  invoiceNumber?: string;
  error?: string;
}

/**
 * POS Sale Creator (POS-1, POS-2, POS-4)
 */
export async function createPosSaleRecord(params: CreatePosSaleParams): Promise<CreatePosSaleResult> {
  const { actorRole, subtotalPaise, discountPaise, discountReason } = params;

  // POS-1: Only staff or owner
  if (actorRole !== 'staff' && actorRole !== 'owner' && actorRole !== 'admin_owner') {
    return {
      success: false,
      error: 'UNAUTHORIZED_POS_ROLE'
    };
  }

  // POS-3: Validate discount
  const discountVal = validatePosDiscount(actorRole, subtotalPaise, discountPaise, discountReason);
  if (!discountVal.valid) {
    return {
      success: false,
      error: discountVal.error
    };
  }

  return {
    success: true,
    saleId: `POS_${Date.now()}`
  };
}

export interface VoidPosSaleParams {
  actorRole: string;
  actorId: string;
  saleId: string;
  authTimestampSeconds: number;
  reason: string;
}

/**
 * POS Void Event (POS-5)
 * Requires owner role, written reason, and step-up authentication within 300s.
 */
export async function voidPosSaleRecord(params: VoidPosSaleParams): Promise<{ success: boolean; error?: string }> {
  const { actorRole, authTimestampSeconds, reason } = params;

  if (actorRole !== 'owner' && actorRole !== 'admin_owner') {
    return {
      success: false,
      error: 'OWNER_ROLE_REQUIRED_FOR_VOID'
    };
  }

  if (!reason || reason.trim().length === 0) {
    return {
      success: false,
      error: 'REASON_REQUIRED'
    };
  }

  try {
    assertStepUpFreshness(authTimestampSeconds);
  } catch (err: any) {
    return {
      success: false,
      error: 'STEP_UP_REQUIRED'
    };
  }

  return { success: true };
}

export interface RefundAuthParams {
  refundPaise: number;
  admin24hRefundCount: number;
  isSecondAdminApproved?: boolean;
}

export interface RefundAuthResult {
  permitted: boolean;
  needsSecondApproval: boolean;
}

/**
 * Dual Admin Refund Authorization Check (REFUND-3)
 * Refund > ₹2,000 or 3rd refund in 24 hours by same admin requires second approval.
 */
export function validateRefundAuthorization(params: RefundAuthParams): RefundAuthResult {
  const { refundPaise, admin24hRefundCount, isSecondAdminApproved } = params;

  const exceedsAmountThreshold = refundPaise > DUAL_REFUND_THRESHOLD_PAISE;
  const exceedsCountThreshold = admin24hRefundCount >= DUAL_REFUND_COUNT_THRESHOLD;

  if (exceedsAmountThreshold || exceedsCountThreshold) {
    if (!isSecondAdminApproved) {
      return {
        permitted: false,
        needsSecondApproval: true
      };
    }
  }

  return {
    permitted: true,
    needsSecondApproval: false
  };
}

export interface PriceChangeResult {
  allowed: boolean;
  needsConfirmation: boolean;
  error?: string;
}

/**
 * Double Confirmation Guard for Price Changes > 50% (ADMINPRICE-2)
 */
export function validatePriceChangeConfirmation(
  oldPricePaise: number,
  newPricePaise: number,
  isDoubleConfirmed: boolean
): PriceChangeResult {
  if (oldPricePaise <= 0) {
    return { allowed: true, needsConfirmation: false };
  }

  const changeRatio = Math.abs(newPricePaise - oldPricePaise) / oldPricePaise;

  if (changeRatio > 0.5) {
    if (!isDoubleConfirmed) {
      return {
        allowed: false,
        needsConfirmation: true,
        error: 'PRICE_CHANGE_CONFIRMATION_REQUIRED'
      };
    }
  }

  return {
    allowed: true,
    needsConfirmation: false
  };
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Cursor-based list pagination for 25 items per view (UI-3)
 */
export function paginateWithCursor<T extends { id: string }>(
  items: T[],
  pageSize = 25
): PaginatedResult<T> {
  const paged = items.slice(0, pageSize);
  const hasMore = items.length > pageSize;
  const nextCursor = hasMore && paged.length > 0 ? paged[paged.length - 1].id : null;

  return {
    items: paged,
    nextCursor,
    hasMore
  };
}
