/**
 * Server-Authoritative Environment & Feature Gate Configuration
 *
 * All feature gates and regulatory settings are read exclusively from trusted
 * server-side environment variables. Browser values or request bodies can NEVER
 * override these server-side settings.
 */

import * as fs from 'fs';
import * as crypto from 'crypto';

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
  whatsappAssistedOrderingEnabled: boolean;
  whatsappCheckoutEnabled: boolean;
  marketplaceAmazonEnabled: boolean;
  marketplaceFlipkartEnabled: boolean;
  publicIndexingEnabled: boolean;
}

export interface RazorpayConfig {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string;
}

export interface PayUConfig {
  payuMerchantKey: string;
  payuMerchantSalt: string;
  payuEnv: 'TEST' | 'PROD';
  payuBaseUrl: string;
  sessionSecret: string;
}

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  corsAllowedOrigins: string[];
  adminAllowedIps?: string[];
}

export function validateFssaiFormat(fssai: string): boolean {
  if (!fssai) return false;
  return /^\d{14}$/.test(fssai.trim());
}

export function validateGstinFormat(gstin: string): boolean {
  if (!gstin) return false;
  return /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/.test(gstin.trim());
}

const fallbackSessionSecret = crypto.randomBytes(32).toString('hex');
const payuEnvSetting = (process.env.PAYU_ENV || 'TEST').toUpperCase() === 'PROD' ? 'PROD' : 'TEST';
const payuBaseUrlDefault = payuEnvSetting === 'PROD' ? 'https://secure.payu.in' : 'https://test.payu.in';

export const envConfig: FeatureGateConfig & RegulatoryConfig & ServerConfig & RazorpayConfig & PayUConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || 'https://satvik-spot-staging.web.app,https://satvik-spot-staging-admin.web.app,https://satvikswaad.com,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5000,http://127.0.0.1:5000,http://localhost:8080').split(',').map(s => s.trim()),
  adminAllowedIps: process.env.ADMIN_ALLOWED_IPS ? process.env.ADMIN_ALLOWED_IPS.split(',').map(s => s.trim()).filter(Boolean) : undefined,
  fssaiStatus: (process.env.FSSAI_STATUS as any) || 'pending',
  fssaiNumber: validateFssaiFormat(process.env.FSSAI_NUMBER || '') ? (process.env.FSSAI_NUMBER || '').trim() : '',
  gstStatus: (process.env.GST_STATUS as any) || 'pending',
  gstin: validateGstinFormat(process.env.GSTIN || '') ? (process.env.GSTIN || '').trim() : '',
  commerceEnabled: process.env.COMMERCE_ENABLED === 'true',
  checkoutEnabled: process.env.CHECKOUT_ENABLED === 'true',
  paymentsEnabled: process.env.PAYMENTS_ENABLED === 'true',
  whatsappAssistedOrderingEnabled: process.env.WHATSAPP_ASSISTED_ORDERING_ENABLED === 'true',
  whatsappCheckoutEnabled: process.env.WHATSAPP_CHECKOUT_ENABLED === 'true',
  marketplaceAmazonEnabled: process.env.MARKETPLACE_AMAZON_ENABLED === 'true',
  marketplaceFlipkartEnabled: process.env.MARKETPLACE_FLIPKART_ENABLED === 'true',
  publicIndexingEnabled: process.env.PUBLIC_INDEXING_ENABLED === 'true',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  payuMerchantKey: process.env.PAYU_MERCHANT_KEY || 'TEST_KEY',
  payuMerchantSalt: process.env.PAYU_MERCHANT_SALT || 'TEST_SALT',
  payuEnv: payuEnvSetting,
  payuBaseUrl: process.env.PAYU_BASE_URL || payuBaseUrlDefault,
  sessionSecret: process.env.SESSION_SECRET || fallbackSessionSecret
};

export const ALLOWED_ENV_NAMES = ['development', 'test', 'local', 'staging', 'production'];

export function validateStartupConfig(overrideEnv?: Partial<ServerConfig & FeatureGateConfig & RegulatoryConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const nodeEnv = overrideEnv?.nodeEnv || process.env.NODE_ENV || envConfig.nodeEnv;
  const rawOrigins = process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim()) : envConfig.corsAllowedOrigins;
  const origins = overrideEnv?.corsAllowedOrigins || rawOrigins;

  // 1. Validate environment name
  if (!ALLOWED_ENV_NAMES.includes(nodeEnv)) {
    errors.push(`Invalid NODE_ENV '${nodeEnv}'. Supported environments: ${ALLOWED_ENV_NAMES.join(', ')}`);
  }

  // 2. Reject wildcard CORS origins
  if (origins.includes('*')) {
    errors.push('CRITICAL SECURITY ERROR: Wildcard CORS origin (*) is forbidden');
  }

  // 3. Strict Production Boundary Enforcement
  if (nodeEnv === 'production') {
    // Reject localhost / 127.0.0.1 in production
    const hasLocalhost = origins.some(o => o.includes('localhost') || o.includes('127.0.0.1'));
    if (hasLocalhost) {
      errors.push('CRITICAL SECURITY ERROR: Production CORS allowlist must not contain localhost or 127.0.0.1');
    }

    // Reject insecure HTTP origins in production
    const hasHttp = origins.some(o => o.startsWith('http://'));
    if (hasHttp) {
      errors.push('CRITICAL SECURITY ERROR: Insecure HTTP origins are forbidden in production');
    }

    // Reject staging origins in production
    const hasStaging = origins.some(o => o.includes('satvik-spot-staging'));
    if (hasStaging) {
      errors.push('CRITICAL SECURITY ERROR: Production environment cannot include staging origins in CORS allowlist');
    }
  }

  // 4. Strict Staging Boundary Enforcement
  if (nodeEnv === 'staging') {
    // Reject production origins in staging to prevent cross-environment pollution
    const hasProdDomain = origins.some(o => o.includes('satwikspot.com') || o.includes('satvikswaad.com'));
    if (hasProdDomain) {
      errors.push('CRITICAL SECURITY ERROR: Staging environment cannot include production domains in CORS allowlist');
    }
  }

  // In non-emulator or explicitly tested staging/production environments, ensure Firebase credentials path exists if specified
  if (nodeEnv === 'staging' || nodeEnv === 'production') {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credPath || credPath === 'undefined') {
      errors.push('GOOGLE_APPLICATION_CREDENTIALS environment variable is missing or invalid.');
    } else if (!fs.existsSync(credPath)) {
      errors.push('Specified GOOGLE_APPLICATION_CREDENTIALS file does not exist.');
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

  // Razorpay credential validation: required only when payments feature flag is enabled
  if (envConfig.paymentsEnabled) {
    if (!envConfig.razorpayKeyId) {
      errors.push('PAYMENTS_ENABLED is true but RAZORPAY_KEY_ID is missing');
    }
    if (!envConfig.razorpayKeySecret) {
      errors.push('PAYMENTS_ENABLED is true but RAZORPAY_KEY_SECRET is missing');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
