/**
 * Server-Authoritative Environment & Feature Gate Configuration
 *
 * All feature gates and regulatory settings are read exclusively from trusted
 * server-side environment variables. Browser values or request bodies can NEVER
 * override these server-side settings.
 */

export interface RegulatoryConfig {
  fssaiStatus: 'pending' | 'applied' | 'verified';
  fssaiNumber: string;
  gstStatus: 'pending' | 'applied' | 'verified';
  gstin: string;
}

export interface FeatureGateConfig {
  commerceEnabled: boolean;
  checkoutEnabled: boolean;
  paymentsEnabled: boolean;
  marketplaceAmazonEnabled: boolean;
  marketplaceFlipkartEnabled: boolean;
  publicIndexingEnabled: boolean;
}

/**
 * Validates FSSAI 14-digit format without claiming format validity proves authenticity.
 * Authenticity verification requires independent owner document inspection.
 */
export function validateFssaiFormat(fssai: string): boolean {
  if (!fssai) return false;
  return /^\d{14}$/.test(fssai.trim());
}

/**
 * Validates GSTIN 15-character format without claiming format validity proves authenticity.
 * Authenticity verification requires independent owner document inspection.
 */
export function validateGstinFormat(gstin: string): boolean {
  if (!gstin) return false;
  return /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/.test(gstin.trim());
}

export const envConfig: FeatureGateConfig & RegulatoryConfig = {
  fssaiStatus: (process.env.FSSAI_STATUS as any) || 'pending',
  fssaiNumber: validateFssaiFormat(process.env.FSSAI_NUMBER || '') ? (process.env.FSSAI_NUMBER || '').trim() : '',
  gstStatus: (process.env.GST_STATUS as any) || 'pending',
  gstin: validateGstinFormat(process.env.GSTIN || '') ? (process.env.GSTIN || '').trim() : '',
  commerceEnabled: process.env.COMMERCE_ENABLED === 'true',
  checkoutEnabled: process.env.CHECKOUT_ENABLED === 'true',
  paymentsEnabled: process.env.PAYMENTS_ENABLED === 'true',
  marketplaceAmazonEnabled: process.env.MARKETPLACE_AMAZON_ENABLED === 'true',
  marketplaceFlipkartEnabled: process.env.MARKETPLACE_FLIPKART_ENABLED === 'true',
  publicIndexingEnabled: process.env.PUBLIC_INDEXING_ENABLED === 'true'
};
