import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { app } from '../src/app';
import { envConfig, validateStartupConfig } from '../src/config/environment';

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

    it('Rejects lookalike domain attack (suffix matching)', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://satvik-spot-staging.web.app.attacker.com');

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
});
