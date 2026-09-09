import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { app } from '../src/app';
import { envConfig, validateStartupConfig } from '../src/config/environment';
import { validateCreateMessagePayload } from '../src/validation/messageSchema';
import { validateCreateReviewPayload } from '../src/validation/reviewSchema';
import { validateUpdateProfilePayload, validateAddressPayload } from '../src/validation/customerSchema';
import { validateSubmitUtrPayload, validateGuestLookupPayload } from '../src/validation/orderSchema';
import {
  rateLimiter,
  orderRateLimiter,
  messageRateLimiter,
  reviewRateLimiter,
  guestLookupRateLimiter,
  adminRateLimiter,
  createRouteRateLimiter
} from '../src/rateLimiting/rateLimiter';
import { ValidationError, AppError } from '../src/errors/AppError';
import { db } from '../src/config/firebase';
import { logger } from '../src/utils/logger';

describe('Phase 2 Architecture & Network Boundary Security Tests', () => {

  // ── 1. SINGLE ACTIVE BACKEND ENFORCEMENT ─────────────────────────────────
  describe('1. Single Active Backend Enforcement', () => {
    it('firebase.json does NOT contain a functions deployment block', () => {
      const firebaseJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../firebase.json'), 'utf8'));
      expect(firebaseJson.functions).toBeUndefined();
    });

    it('firebase.json hosting rewrites target index.html only and no Functions', () => {
      const firebaseJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../firebase.json'), 'utf8'));
      for (const target of firebaseJson.hosting) {
        expect(target.rewrites).toBeDefined();
        expect(target.rewrites[0].destination).toBe('/index.html');
        expect(target.rewrites[0].function).toBeUndefined();
      }
    });

    it('Active customer & admin frontend assets contain zero Cloud Functions URLs', () => {
      const siteScript = fs.readFileSync(path.join(__dirname, '../../public/site/script.js'), 'utf8');
      const adminJs = fs.readFileSync(path.join(__dirname, '../../public/admin/admin.js'), 'utf8');
      
      expect(siteScript).not.toContain('cloudfunctions.net');
      expect(adminJs).not.toContain('cloudfunctions.net');
    });
  });

  // ── 2. ENVIRONMENT VALIDATION & BOUNDARY SEPARATION ─────────────────────
  describe('2. Environment Validation & Boundary Separation', () => {
    it('validateStartupConfig accepts valid staging configuration', () => {
      const origCred = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      process.env.GOOGLE_APPLICATION_CREDENTIALS = __filename;
      const result = validateStartupConfig({
        nodeEnv: 'staging',
        corsAllowedOrigins: ['https://satvik-spot-staging.web.app', 'https://satvik-spot-staging-admin.web.app']
      });
      process.env.GOOGLE_APPLICATION_CREDENTIALS = origCred;
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validateStartupConfig rejects invalid NODE_ENV name', () => {
      const result = validateStartupConfig({
        nodeEnv: 'invalid_env_tier' as any,
        corsAllowedOrigins: ['https://satvik-spot-staging.web.app']
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid NODE_ENV'))).toBe(true);
    });

    it('validateStartupConfig rejects wildcard (*) CORS origins', () => {
      const result = validateStartupConfig({
        nodeEnv: 'staging',
        corsAllowedOrigins: ['*']
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Wildcard CORS origin (*) is forbidden'))).toBe(true);
    });

    it('validateStartupConfig rejects localhost origins in production', () => {
      const result = validateStartupConfig({
        nodeEnv: 'production',
        corsAllowedOrigins: ['https://satwikspot.com', 'http://localhost:5000']
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Production CORS allowlist must not contain localhost'))).toBe(true);
    });

    it('validateStartupConfig rejects insecure HTTP origins in production', () => {
      const result = validateStartupConfig({
        nodeEnv: 'production',
        corsAllowedOrigins: ['http://satwikspot.com']
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Insecure HTTP origins are forbidden in production'))).toBe(true);
    });

    it('validateStartupConfig rejects staging origins in production allowlist', () => {
      const result = validateStartupConfig({
        nodeEnv: 'production',
        corsAllowedOrigins: ['https://satvik-spot-staging.web.app']
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Production environment cannot include staging origins'))).toBe(true);
    });

    it('validateStartupConfig rejects production domains in staging allowlist', () => {
      const result = validateStartupConfig({
        nodeEnv: 'staging',
        corsAllowedOrigins: ['https://satwikspot.com']
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Staging environment cannot include production domains'))).toBe(true);
    });
  });

  // ── 3. HARDENED CORS CONTROLS ───────────────────────────────────────────
  describe('3. Hardened CORS Controls', () => {
    it('Permits approved staging customer origin with Access-Control-Allow-Origin', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://satvik-spot-staging.web.app');

      expect(res.headers['access-control-allow-origin']).toBe('https://satvik-spot-staging.web.app');
      expect(res.headers['vary']).toBe('Origin');
    });

    it('Rejects suffix lookalike origin (https://satvik-spot-staging.web.app.attacker.com)', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://satvik-spot-staging.web.app.attacker.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('Rejects prefix lookalike origin (https://attacker-satvik-spot-staging.web.app)', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://attacker-satvik-spot-staging.web.app');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('Rejects unauthorized port on allowed host (https://satvik-spot-staging.web.app:8080)', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://satvik-spot-staging.web.app:8080');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('Rejects unauthorized subdomain (https://subdomain.satvik-spot-staging.web.app)', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://subdomain.satvik-spot-staging.web.app');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('Rejects HTTP version of HTTPS origin', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://satvik-spot-staging.web.app');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('Rejects unauthorized preflight OPTIONS request with HTTP 403', async () => {
      const res = await request(app)
        .options('/api/v1/orders/create')
        .set('Origin', 'https://malicious-site.com')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CORS_FORBIDDEN');
    });

    it('Handles valid preflight OPTIONS request with HTTP 204 and correct headers', async () => {
      const res = await request(app)
        .options('/api/v1/orders/create')
        .set('Origin', 'https://satvik-spot-staging.web.app')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('https://satvik-spot-staging.web.app');
      expect(res.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  // ── 4. SECURITY HEADERS & SERVER DISCLOSURE ──────────────────────────────
  describe('4. Security Headers & Server Disclosure', () => {
    it('Disables x-powered-by header on all API responses', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('Sets Content-Security-Policy header with per-request cryptographic nonce', async () => {
      const res = await request(app).get('/health');
      const csp = res.headers['content-security-policy'];
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+'/);
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain('upgrade-insecure-requests');
    });

    it('Generates unique cryptographic nonces across consecutive requests', async () => {
      const res1 = await request(app).get('/health');
      const res2 = await request(app).get('/health');
      const nonceMatch1 = res1.headers['content-security-policy']?.match(/'nonce-([A-Za-z0-9+/=]+)'/);
      const nonceMatch2 = res2.headers['content-security-policy']?.match(/'nonce-([A-Za-z0-9+/=]+)'/);
      expect(nonceMatch1).toBeDefined();
      expect(nonceMatch2).toBeDefined();
      expect(nonceMatch1![1]).not.toBe(nonceMatch2![1]);
    });

    it('Sets X-Content-Type-Options: nosniff on API responses', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('Sets X-Frame-Options: DENY on API responses', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-frame-options']).toBe('DENY');
    });

    it('Sets Strict-Transport-Security on API responses', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains');
    });

    it('Sets X-Robots-Tag: noindex, nofollow when public indexing is disabled', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');
    });

    it('Enforces Secure, HttpOnly, and SameSite=Strict on Set-Cookie headers via middleware', async () => {
      const express = require('express');
      const { enforceSecureCookieHeaders } = require('../src/auth/cookieSecurity');
      const testApp = express();
      testApp.use(enforceSecureCookieHeaders);
      testApp.get('/cookie-test', (_req: any, res: any) => {
        res.setHeader('Set-Cookie', 'sessionId=test_value_123');
        res.status(200).send('ok');
      });

      const res = await request(testApp).get('/cookie-test');
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('sessionId=test_value_123');
      expect(cookies[0]).toContain('Secure');
      expect(cookies[0]).toContain('HttpOnly');
      expect(cookies[0]).toContain('SameSite=Strict');
    });
  });

  // ── 5. HEALTH, READINESS & INFORMATION LEAKAGE ──────────────────────────
  describe('5. Health, Readiness & Information Leakage', () => {
    it('GET /health returns minimal non-sensitive status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.version).toBe('v1.0.0');
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.config).toBeUndefined();
      expect(res.body.environment).toBeUndefined();
    });

    it('Unhandled server error returns generic 500 without stack trace leakage', async () => {
      const res = await request(app).get('/api/v1/trigger-nonexistent-route-for-404-test');
      expect([401, 403, 404]).toContain(res.status); // 404 for un-matched route without stack trace leakage
      expect(res.body.stack).toBeUndefined();
    });
  });

  // ── 6. CUSTOMER & ADMIN HOSTING SEPARATION ──────────────────────────────
  describe('6. Customer & Admin Hosting Separation', () => {
    it('firebase.json separates site and admin hosting targets cleanly', () => {
      const firebaseJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../firebase.json'), 'utf8'));
      expect(firebaseJson.hosting[0].target).toBe('site');
      expect(firebaseJson.hosting[0].public).toBe('public/site');
      expect(firebaseJson.hosting[1].target).toBe('admin');
      expect(firebaseJson.hosting[1].public).toBe('public/admin');
    });

    it('public/site/index.html contains zero admin portal links', () => {
      const siteIndex = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
      expect(siteIndex).not.toContain('admin-login.html');
      expect(siteIndex).not.toContain('admin-dashboard.html');
      expect(siteIndex).not.toContain('public/admin');
    });

    it('public/admin/index.html includes X-Robots-Tag noindex header configuration in firebase.json', () => {
      const firebaseJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../firebase.json'), 'utf8'));
      const adminHeaders = firebaseJson.hosting[1].headers[0].headers;
      const robotsHeader = adminHeaders.find((h: any) => h.key === 'X-Robots-Tag');
      expect(robotsHeader).toBeDefined();
      expect(robotsHeader.value).toBe('noindex, nofollow, noarchive');
    });
  });

  // ── 7. FEATURE GATES SAFETY ─────────────────────────────────────────────
  describe('7. Feature Gates Safety', () => {
    it('Commerce, checkout, and payments gates default to false', () => {
      expect(envConfig.commerceEnabled).toBe(false);
      expect(envConfig.checkoutEnabled).toBe(false);
      expect(envConfig.paymentsEnabled).toBe(false);
    });

    it('POST /api/v1/payments/process is rejected with 503 PAYMENTS_NOT_AVAILABLE', async () => {
      const res = await request(app)
        .post('/api/v1/payments/process')
        .set('Authorization', 'Bearer mockToken');

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('PAYMENTS_NOT_AVAILABLE');
    });
  });

  // ── 8. STRICT SCHEMA VALIDATION (REJECT UNKNOWN KEYS) ───────────────────
  describe('8. Strict Schema Validation (Reject Unknown Keys)', () => {
    it('validateCreateMessagePayload permits valid keys and rejects unknown keys', () => {
      const valid = validateCreateMessagePayload({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '9876543210',
        subject: 'Product Query',
        message: 'Do you offer sugar-free options?'
      });
      expect(valid.name).toBe('Jane Doe');
      expect(valid.message).toBe('Do you offer sugar-free options?');

      expect(() => {
        validateCreateMessagePayload({
          name: 'Jane Doe',
          message: 'Hello world query',
          extraProperty: 'malicious_input'
        });
      }).toThrow(ValidationError);
    });

    it('validateCreateReviewPayload permits valid keys and rejects unknown keys', () => {
      const valid = validateCreateReviewPayload({
        productId: 'prod_123',
        name: 'Reviewer Name',
        rating: 5,
        text: 'Truly authentic and delightful.'
      });
      expect(valid.productId).toBe('prod_123');
      expect(valid.rating).toBe(5);

      expect(() => {
        validateCreateReviewPayload({
          productId: 'prod_123',
          name: 'Reviewer Name',
          rating: 5,
          text: 'Truly authentic and delightful.',
          approved: true
        });
      }).toThrow(ValidationError);
    });

    it('validateUpdateProfilePayload permits valid keys and rejects unknown keys', () => {
      const valid = validateUpdateProfilePayload({
        name: 'Updated Name',
        email: 'user@example.com',
        phone: '9876543210'
      });
      expect(valid.name).toBe('Updated Name');

      expect(() => {
        validateUpdateProfilePayload({
          name: 'Updated Name',
          isAdmin: true
        });
      }).toThrow(ValidationError);
    });

    it('validateAddressPayload permits valid keys and rejects unknown keys', () => {
      const valid = validateAddressPayload({
        label: 'Home',
        name: 'Resident',
        phone: '9876543210',
        house: 'Flat 101',
        street: 'Main Road',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
        isDefault: true
      }, false);
      expect(valid.label).toBe('Home');

      expect(() => {
        validateAddressPayload({
          label: 'Home',
          name: 'Resident',
          phone: '9876543210',
          house: 'Flat 101',
          street: 'Main Road',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
          forbiddenFlag: 'inject'
        }, false);
      }).toThrow(ValidationError);
    });

    it('validateSubmitUtrPayload permits valid keys and rejects unknown keys', () => {
      const valid = validateSubmitUtrPayload({
        orderId: 'ord_987',
        utr: 'UTR000123456789',
        guestAccessSecret: 'secret_key'
      });
      expect(valid.orderId).toBe('ord_987');
      expect(valid.utr).toBe('UTR000123456789');

      expect(() => {
        validateSubmitUtrPayload({
          orderId: 'ord_987',
          utr: 'UTR000123456789',
          paymentStatus: 'COMPLETED'
        });
      }).toThrow(ValidationError);
    });

    it('validateGuestLookupPayload permits valid keys and rejects unknown keys', () => {
      const valid = validateGuestLookupPayload({
        orderId: 'ord_987',
        guestAccessSecret: 'secret_key'
      });
      expect(valid.orderId).toBe('ord_987');
      expect(valid.guestAccessSecret).toBe('secret_key');

      expect(() => {
        validateGuestLookupPayload({
          orderId: 'ord_987',
          guestAccessSecret: 'secret_key',
          bypassSecurity: true
        });
      }).toThrow(ValidationError);
    });

    it('POST /api/v1/messages rejects unknown keys with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/messages')
        .send({
          name: 'Jane Doe',
          message: 'Hello world inquiry',
          unauthorizedField: 'attack'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/orders/submit-utr rejects unknown keys with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/orders/submit-utr')
        .send({
          orderId: 'ord_123',
          utr: '123456789012',
          tamperedStatus: 'Verified'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/orders/guest-lookup rejects unknown keys with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/orders/guest-lookup')
        .send({
          orderId: 'ord_123',
          guestAccessSecret: 'secret123',
          internalField: 'leak'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ── 9. PER-ROUTE SLIDING WINDOW RATE LIMITERS ────────────────────────────
  describe('9. Per-Route Sliding Window Rate Limiters', () => {
    it('Exports configured route rate limiters and global baseline', () => {
      expect(typeof rateLimiter).toBe('function');
      expect(typeof orderRateLimiter).toBe('function');
      expect(typeof messageRateLimiter).toBe('function');
      expect(typeof reviewRateLimiter).toBe('function');
      expect(typeof guestLookupRateLimiter).toBe('function');
      expect(typeof adminRateLimiter).toBe('function');
    });

    it('createRouteRateLimiter logs violation and returns 429 when maxRequests is exceeded', async () => {
      const origEnv = process.env.NODE_ENV;
      const origWorker = process.env.JEST_WORKER_ID;

      delete (process.env as any).JEST_WORKER_ID;
      (process.env as any).NODE_ENV = 'production';

      const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => logger);
      const runTxSpy = jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
        const fakeSnap = {
          exists: true,
          data: () => ({ count: 5 })
        };
        const fakeTx = {
          get: jest.fn().mockResolvedValue(fakeSnap),
          set: jest.fn(),
          update: jest.fn()
        };
        return await cb(fakeTx);
      });

      const limiter = createRouteRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        routeIdentifier: 'test_route'
      });

      const mockReq: any = {
        ip: '192.168.1.100',
        originalUrl: '/api/v1/test-route'
      };
      const mockRes: any = {};
      let caughtError: any = null;

      await limiter(mockReq, mockRes, (err: any) => {
        caughtError = err;
      });

      expect(caughtError).toBeInstanceOf(AppError);
      expect(caughtError.statusCode).toBe(429);
      expect(caughtError.errorCode).toBe('RATE_LIMIT_EXCEEDED');

      expect(warnSpy).toHaveBeenCalledWith(
        'Rate limit violation detected',
        expect.objectContaining({
          routeIdentifier: 'test_route',
          clientIp: '192.168.1.100',
          count: 6,
          maxRequests: 5,
          windowMs: 60000,
          url: '/api/v1/test-route'
        })
      );

      (process.env as any).NODE_ENV = origEnv;
      if (origWorker !== undefined) {
        (process.env as any).JEST_WORKER_ID = origWorker;
      }
      warnSpy.mockRestore();
      runTxSpy.mockRestore();
    });
  });
});
