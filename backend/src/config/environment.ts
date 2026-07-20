/**
 * Server-Authoritative Environment & Feature Gate Configuration
 *
 * All feature gates and regulatory settings are read exclusively from trusted
 * server-side environment variables. Browser values or request bodies can NEVER
 * override these server-side settings.
 */

import * as fs from 'fs';

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

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  corsAllowedOrigins: string[];
}

export function validateFssaiFormat(fssai: string): boolean {
  if (!fssai) return false;
  return /^\d{14}$/.test(fssai.trim());
}

export function validateGstinFormat(gstin: string): boolean {
  if (!gstin) return false;
  return /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/.test(gstin.trim());
}

export const envConfig: FeatureGateConfig & RegulatoryConfig & ServerConfig = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || 'https://satvik-spot-staging.web.app,https://satvik-spot-staging-admin.web.app,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5000,http://127.0.0.1:5000,http://localhost:8080').split(',').map(s => s.trim()),
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

export function validateStartupConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.FIRESTORE_EMULATOR_HOST !== undefined;

  // In non-emulator staging/production environments, ensure Firebase credentials path exists if specified
  if (!isEmulator && (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production')) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath && !fs.existsSync(credPath)) {
      errors.push(`Specified GOOGLE_APPLICATION_CREDENTIALS file does not exist at '${credPath}'`);
    }
  }

  // FSSAI/GSTIN optional validations (optional pending values MUST NOT fail startup)
  if (process.env.FSSAI_NUMBER && !validateFssaiFormat(process.env.FSSAI_NUMBER)) {
    console.warn(`[WARN] FSSAI_NUMBER '${process.env.FSSAI_NUMBER}' is not in valid 14-digit format.`);
  }

  if (process.env.GSTIN && !validateGstinFormat(process.env.GSTIN)) {
    console.warn(`[WARN] GSTIN '${process.env.GSTIN}' is not in valid 15-character format.`);
  }

  // Do not fail startup merely because intentionally disabled optional integrations have no credentials
  if (envConfig.marketplaceAmazonEnabled && !process.env.AMAZON_SP_API_REFRESH_TOKEN) {
    errors.push('AMAZON_CONNECTOR_ENABLED is true but AMAZON_SP_API_REFRESH_TOKEN is missing');
  }

  if (envConfig.marketplaceFlipkartEnabled && !process.env.FLIPKART_CLIENT_SECRET) {
    errors.push('FLIPKART_CONNECTOR_ENABLED is true but FLIPKART_CLIENT_SECRET is missing');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
