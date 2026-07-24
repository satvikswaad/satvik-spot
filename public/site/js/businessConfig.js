/**
 * Centralized Storefront Business Configuration — Satvik Swaad
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
];

export function validateUtrFormat(utr) {
  if (!utr || typeof utr !== 'string') return false;
  return /^[a-zA-Z0-9]{6,30}$/.test(utr.trim());
}

export function validateIndianMobileNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  const subscriberNumber = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(subscriberNumber);
}

export function buildWhatsAppUrl(prefilledText) {
  const encodedText = encodeURIComponent(prefilledText);
  return `https://wa.me/${BUSINESS_CONFIG.whatsapp.waMeNumber}?text=${encodedText}`;
}

export function buildWebWhatsAppUrl(prefilledText) {
  const encodedText = encodeURIComponent(prefilledText);
  return `https://web.whatsapp.com/send?phone=${BUSINESS_CONFIG.whatsapp.waMeNumber}&text=${encodedText}`;
}
