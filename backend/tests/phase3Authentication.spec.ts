import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { app } from '../src/app';
import { envConfig } from '../src/config/environment';

describe('Phase 3 Authentication, Admin Identity, RBAC & Session Security Tests', () => {

  // ── 1. CREDENTIAL & BYPASS SANITATION ─────────────────────────────────────
  describe('1. Credential & Bypass Sanitation', () => {
    it('No hardcoded admin passwords or master passwords exist in backend source code', () => {
      const appTs = fs.readFileSync(path.join(__dirname, '../src/app.ts'), 'utf8');
      const verifyAuthTs = fs.readFileSync(path.join(__dirname, '../src/auth/verifyAuth.ts'), 'utf8');
      const adminMiddlewareTs = fs.readFileSync(path.join(__dirname, '../src/auth/adminMiddleware.ts'), 'utf8');

      expect(appTs).not.toContain('masterPassword');
      expect(appTs).not.toContain('adminCode');
      expect(verifyAuthTs).not.toContain('masterPassword');
      expect(adminMiddlewareTs).not.toContain('adminCode');
    });

    it('No hardcoded admin credentials exist in customer portal assets', () => {
      const siteScript = fs.readFileSync(path.join(__dirname, '../../public/site/script.js'), 'utf8');
      const siteIndex = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');

      expect(siteScript).not.toContain('admin@');
      expect(siteScript).not.toContain('isAdmin');
      expect(siteIndex).not.toContain('admin-dashboard');
    });

    it('Customer landing page public/site/index.html contains zero admin portal links', () => {
      const siteIndex = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
      expect(siteIndex).not.toContain('href="admin');
      expect(siteIndex).not.toContain('href="/admin');
      expect(siteIndex).not.toContain('admin-login.html');
    });
  });

  // ── 2. BEARER TOKEN PARSING & VERIFICATION ────────────────────────────────
  describe('2. Bearer Token Parsing & Verification', () => {
    it('Rejects unauthenticated requests to protected admin endpoint with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard-summary');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('Rejects malformed Authorization header (missing Bearer prefix) with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard-summary')
        .set('Authorization', 'Basic dXNlcjpwYXNz');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('Rejects empty Bearer token with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard-summary')
        .set('Authorization', 'Bearer ');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('Rejects revoked or invalid token with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard-summary')
        .set('Authorization', 'Bearer mock_revoked_token');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ── 3. FAIL-CLOSED ADMIN AUTHORIZATION & RBAC ─────────────────────────────
  describe('3. Fail-Closed Admin Authorization & RBAC', () => {
    it('Rejects customer token (admin: false) from admin dashboard with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard-summary')
        .set('Authorization', 'Bearer mock_cust_token');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Allows verified owner token (admin: true, role: admin_owner) with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard-summary')
        .set('Authorization', 'Bearer mock_owner_token');

      expect(res.status).toBe(200);
      expect(res.body.metrics).toBeDefined();
    });

    it('Rejects customer attempt to access admin audit logs with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-events')
        .set('Authorization', 'Bearer mock_cust_token');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ── 4. RECENT AUTHENTICATION ENFORCEMENT ─────────────────────────────────
  describe('4. Recent Authentication Enforcement', () => {
    it('Allows sensitive operation (archive product) with fresh authentication', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products/p_test_1/archive')
        .set('Authorization', 'Bearer mock_owner_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Rejects sensitive operation (archive product) when authentication is older than 15 minutes with 428 REAUTHENTICATION_REQUIRED', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products/p_test_1/archive')
        .set('Authorization', 'Bearer mock_stale_auth_token');

      expect(res.status).toBe(428);
      expect(res.body.error.code).toBe('REAUTHENTICATION_REQUIRED');
    });
  });

  // ── 5. FEATURE GATES & REGULATORY SAFETY ────────────────────────────────
  describe('5. Feature Gates & Regulatory Safety', () => {
    it('Commerce, checkout, and payments gates default to false', () => {
      expect(envConfig.commerceEnabled).toBe(false);
      expect(envConfig.checkoutEnabled).toBe(false);
      expect(envConfig.paymentsEnabled).toBe(false);
    });

    it('POST /api/v1/payments/process is rejected with 503 PAYMENTS_NOT_AVAILABLE', async () => {
      const res = await request(app)
        .post('/api/v1/payments/process')
        .set('Authorization', 'Bearer mock_owner_token');

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('PAYMENTS_NOT_AVAILABLE');
    });
  });
});
