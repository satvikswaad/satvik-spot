/**
 * Centralized Official Business Configuration — Satvik Swaad
 *
 * Official WhatsApp Business Number: +919236587600
 * Indian Subscriber Number: 9236587600 (10 digits)
 * wa.me API format: 919236587600 (no spaces, hyphens, brackets)
 */

export const BUSINESS_CONFIG = {
  brandName: 'Satvik Swaad',
  legalName: 'Satvik Swaad',
  supportEmail: 'contact@satvikswaad.com',
  whatsapp: {
    displayNumber: '+919236587600',
    waMeNumber: '919236587600',
    subscriberNumber: '9236587600',
    countryCode: '91'
  }
};

export const CONTROLLED_REJECTION_REASONS = [
  'PAYMENT_NOT_RECEIVED',
  'INVALID_UTR_REFERENCE',
  'ORDER_CANCELLED_BY_CUSTOMER',
  'DUPLICATE_UTR',
  'EXPIRED_REQUEST',
  'OTHER'
] as const;

export type RejectionReasonCode = typeof CONTROLLED_REJECTION_REASONS[number];

/**
 * Validates UTR / Transaction Reference format (6-30 alphanumeric characters).
 */
export function validateUtrFormat(utr: string): boolean {
  if (!utr || typeof utr !== 'string') return false;
  return /^[a-zA-Z0-9]{6,30}$/.test(utr.trim());
}

/**
 * Validates that an Indian subscriber number contains exactly 10 digits.
 */
export function validateIndianMobileNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  const subscriberNumber = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(subscriberNumber);
}

/**
 * Formats a 10-digit mobile number into safe wa.me format (91XXXXXXXXXX).
 */
export function formatWaMeNumber(phone?: string): string {
  if (phone && validateIndianMobileNumber(phone)) {
    const digits = phone.replace(/\D/g, '').slice(-10);
    return `91${digits}`;
  }
  return BUSINESS_CONFIG.whatsapp.waMeNumber;
}

/**
 * Constructs a safe wa.me URL with prefilled text encoded using encodeURIComponent.
 */
export function buildWhatsAppUrl(prefilledText: string): string {
  const encodedText = encodeURIComponent(prefilledText);
  return `https://wa.me/${BUSINESS_CONFIG.whatsapp.waMeNumber}?text=${encodedText}`;
}

/**
 * Constructs a safe Web WhatsApp URL fallback (web.whatsapp.com/send?phone=...&text=...).
 */
export function buildWebWhatsAppUrl(prefilledText: string): string {
  const encodedText = encodeURIComponent(prefilledText);
  return `https://web.whatsapp.com/send?phone=${BUSINESS_CONFIG.whatsapp.waMeNumber}&text=${encodedText}`;
}
