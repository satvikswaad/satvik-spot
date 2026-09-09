import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { app } from '../src/app';
import { envConfig } from '../src/config/environment';
import { getRecordedAuditLogs, clearRecordedAuditLogs } from '../src/audit/auditLogger';

describe('Phase 3 Authentication, Admin Identity, RBAC & Session Security Tests', () => {

  beforeEach(() => {
    clearRecordedAuditLogs();
    envConfig.adminAllowedIps = undefined;
    delete process.env.ADMIN_ALLOWED_IPS;
  });

  afterEach(() => {
    envConfig.adminAllowedIps = undefined;
    delete process.env.ADMIN_ALLOWED_IPS;
    clearRecordedAuditLogs();
  });

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

  // ── 3. PER-ADMIN TOTP MFA ENFORCEMENT ──────────────────────────────────────
  describe('3. Per-Admin TOTP MFA Enforcement', () => {
    it('Rejects admin request when MFA is not verified (mfaVerified: false) with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard-summary')
        .set('Authorization', 'Bearer mock_admin_no_mfa_token');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('Multi-Factor Authentication (MFA) verification required');
    });

    it('Allows admin request when MFA is verified with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard-summary')
        .set('Authorization', 'Bearer mock_owner_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ── 4. FAIL-CLOSED ADMIN AUTHORIZATION & RBAC MATRIX ──────────────────────
  describe('4. Fail-Closed Admin Authorization & RBAC Matrix', () => {
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

    // ── RBAC: catalog_manager ───────────────────────────────────────────────
    describe('Role: catalog_manager', () => {
      it('Allows catalog_manager to create product', async () => {
        const res = await request(app)
          .post('/api/v1/admin/products')
          .set('Authorization', 'Bearer mock_catalog_manager_token')
          .send({
            id: 'prod_test_cat',
            sku: 'SKU-CAT-01',
            name: 'Aam Ka Achar Test',
            price: 250,
            stock: 20
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      });

      it('Allows catalog_manager to archive product', async () => {
        const res = await request(app)
          .post('/api/v1/admin/products/p_test_cat/archive')
          .set('Authorization', 'Bearer mock_catalog_manager_token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('Allows catalog_manager to update stock', async () => {
        const res = await request(app)
          .patch('/api/v1/admin/products/p_test_cat/stock')
          .set('Authorization', 'Bearer mock_catalog_manager_token')
          .send({ newStock: 15, reason: 'Restock batch' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('Rejects catalog_manager from transitioning orders with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_101/transition')
          .set('Authorization', 'Bearer mock_catalog_manager_token')
          .send({ targetStatus: 'Confirmed' });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('order_manager');
      });

      it('Rejects catalog_manager from verifying payment with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_101/verify-payment')
          .set('Authorization', 'Bearer mock_catalog_manager_token')
          .send({ action: 'ACCEPT', confirmBankCredit: true, receivedAmount: 500 });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('financial_auditor');
      });

      it('Rejects catalog_manager from accessing audit logs with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .get('/api/v1/admin/audit-events')
          .set('Authorization', 'Bearer mock_catalog_manager_token');

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('admin_owner');
      });
    });

    // ── RBAC: order_manager ─────────────────────────────────────────────────
    describe('Role: order_manager', () => {
      it('Allows order_manager to access dashboard summary', async () => {
        const res = await request(app)
          .get('/api/v1/admin/dashboard-summary')
          .set('Authorization', 'Bearer mock_order_manager_token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('Allows order_manager to transition order status', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_102/transition')
          .set('Authorization', 'Bearer mock_order_manager_token')
          .send({ targetStatus: 'Confirmed' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('Rejects order_manager from creating products with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/products')
          .set('Authorization', 'Bearer mock_order_manager_token')
          .send({
            id: 'prod_forbidden',
            sku: 'SKU-FORBIDDEN',
            name: 'Forbidden Pickle',
            price: 100,
            stock: 5
          });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('catalog_manager');
      });

      it('Rejects order_manager from verifying payments with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_102/verify-payment')
          .set('Authorization', 'Bearer mock_order_manager_token')
          .send({ action: 'ACCEPT', confirmBankCredit: true, receivedAmount: 500 });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('financial_auditor');
      });
    });

    // ── RBAC: financial_auditor ─────────────────────────────────────────────
    describe('Role: financial_auditor', () => {
      it('Allows financial_auditor to verify payment (ACCEPT)', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_103/verify-payment')
          .set('Authorization', 'Bearer mock_financial_auditor_token')
          .send({ action: 'ACCEPT', confirmBankCredit: true, receivedAmount: 750 });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('Rejects financial_auditor from archiving products with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/products/p_test_1/archive')
          .set('Authorization', 'Bearer mock_financial_auditor_token');

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('catalog_manager');
      });

      it('Rejects financial_auditor from transitioning order status with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_103/transition')
          .set('Authorization', 'Bearer mock_financial_auditor_token')
          .send({ targetStatus: 'Confirmed' });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('order_manager');
      });
    });

    // ── RBAC: support_agent ─────────────────────────────────────────────────
    describe('Role: support_agent', () => {
      it('Allows support_agent to update message status', async () => {
        const res = await request(app)
          .post('/api/v1/admin/messages/msg_test_1/status')
          .set('Authorization', 'Bearer mock_support_agent_token')
          .send({ status: 'read' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('Allows support_agent to moderate customer review', async () => {
        const res = await request(app)
          .post('/api/v1/admin/reviews/rev_test_1/moderate')
          .set('Authorization', 'Bearer mock_support_agent_token')
          .send({ approved: true, moderationReason: 'Complies with guidelines' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('Rejects support_agent from modifying inventory stock with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .patch('/api/v1/admin/products/p_test_1/stock')
          .set('Authorization', 'Bearer mock_support_agent_token')
          .send({ newStock: 50 });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('catalog_manager');
      });
    });

    // ── RBAC: admin_owner (Superuser) ───────────────────────────────────────
    describe('Role: admin_owner (Superuser)', () => {
      it('Allows admin_owner to access audit logs viewer', async () => {
        const res = await request(app)
          .get('/api/v1/admin/audit-events')
          .set('Authorization', 'Bearer mock_owner_token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.logs)).toBe(true);
      });

      it('Allows admin_owner to verify payments', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_owner_1/verify-payment')
          .set('Authorization', 'Bearer mock_owner_token')
          .send({ action: 'ACCEPT', confirmBankCredit: true, receivedAmount: 1200 });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });
  });

  // ── 5. RECENT AUTHENTICATION ENFORCEMENT ─────────────────────────────────
  describe('5. Recent Authentication Enforcement', () => {
    it('Allows sensitive operation (archive product) with fresh authentication', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products/p_test_1/archive')
        .set('Authorization', 'Bearer mock_owner_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Rejects sensitive operation (archive product) when authentication is older than 5 minutes (300s) with 428 REAUTHENTICATION_REQUIRED', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products/p_test_1/archive')
        .set('Authorization', 'Bearer mock_stale_auth_token');

      expect(res.status).toBe(428);
      expect(res.body.error.code).toBe('REAUTHENTICATION_REQUIRED');
    });
  });

  // ── 6. IP ALLOWLISTING & NETWORK ISOLATION ────────────────────────────────
  describe('6. IP Allowlisting & Network Isolation', () => {
    it('Rejects admin route when client IP is not in configured adminAllowedIps with 403 ADMIN_IP_RESTRICTED', async () => {
      envConfig.adminAllowedIps = ['198.51.100.1', '203.0.113.10'];

      const res = await request(app)
        .get('/api/v1/admin/dashboard-summary')
        .set('Authorization', 'Bearer mock_owner_token');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ADMIN_IP_RESTRICTED');
      expect(res.body.error.message).toContain('Unauthorized IP');
    });

    it('Allows admin route when client IP is included in adminAllowedIps', async () => {
      envConfig.adminAllowedIps = ['127.0.0.1', '::ffff:127.0.0.1', '::1'];

      const res = await request(app)
        .get('/api/v1/admin/dashboard-summary')
        .set('Authorization', 'Bearer mock_owner_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Permits admin requests when adminAllowedIps is unconfigured (empty/undefined)', async () => {
      envConfig.adminAllowedIps = undefined;

      const res = await request(app)
        .get('/api/v1/admin/dashboard-summary')
        .set('Authorization', 'Bearer mock_owner_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ── 7. BEFORE / AFTER STATE AUDIT LOGGING ────────────────────────────────
  describe('7. Before / After State Audit Logging', () => {
    it('Records beforeState: null and afterState on PRODUCT_CREATED', async () => {
      clearRecordedAuditLogs();

      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', 'Bearer mock_owner_token')
        .send({
          id: 'prod_audit_1',
          sku: 'SKU-AUDIT-01',
          name: 'Audit Pickle 500g',
          cat: 'achar',
          price: 320,
          mrp: 350,
          stock: 40
        });

      expect(res.status).toBe(201);
      const logs = getRecordedAuditLogs();
      const createLog = logs.find(l => l.action === 'PRODUCT_CREATED' && l.targetRef === 'prod_audit_1');
      expect(createLog).toBeDefined();
      expect(createLog?.beforeState).toBeNull();
      expect(createLog?.afterState).toBeDefined();
      expect(createLog?.afterState.id).toBe('prod_audit_1');
      expect(createLog?.afterState.sku).toBe('SKU-AUDIT-01');
      expect(createLog?.afterState.stock).toBe(40);
      expect(createLog?.outcome).toBe('SUCCESS');
    });

    it('Records beforeState and afterState on PRODUCT_ARCHIVED', async () => {
      clearRecordedAuditLogs();

      const res = await request(app)
        .post('/api/v1/admin/products/prod_audit_archive/archive')
        .set('Authorization', 'Bearer mock_owner_token');

      expect(res.status).toBe(200);
      const logs = getRecordedAuditLogs();
      const archiveLog = logs.find(l => l.action === 'PRODUCT_ARCHIVED' && l.targetRef === 'prod_audit_archive');
      expect(archiveLog).toBeDefined();
      expect(archiveLog?.beforeState).toBeDefined();
      expect(archiveLog?.beforeState.available).toBe(true);
      expect(archiveLog?.afterState).toBeDefined();
      expect(archiveLog?.afterState.available).toBe(false);
    });

    it('Records beforeState and afterState on INVENTORY_ADJUSTED', async () => {
      clearRecordedAuditLogs();

      const res = await request(app)
        .patch('/api/v1/admin/products/prod_stock_test/stock')
        .set('Authorization', 'Bearer mock_owner_token')
        .send({ newStock: 85, reason: 'Restock verification' });

      expect(res.status).toBe(200);
      const logs = getRecordedAuditLogs();
      const stockLog = logs.find(l => l.action === 'INVENTORY_ADJUSTED' && l.targetRef === 'prod_stock_test');
      expect(stockLog).toBeDefined();
      expect(stockLog?.beforeState.stock).toBeDefined();
      expect(stockLog?.afterState.stock).toBe(85);
      expect(stockLog?.details.reason).toBe('Restock verification');
    });

    it('Records beforeState and afterState on PRODUCT_VARIANTS_UPDATED', async () => {
      clearRecordedAuditLogs();

      const testVariants = [
        { id: 'var_250g', label: '250g Glass Jar', price: 150, mrp: 160, stock: 20, sku: 'SKU-VAR-250' },
        { id: 'var_500g', label: '500g Glass Jar', price: 280, mrp: 300, stock: 15, sku: 'SKU-VAR-500' }
      ];

      const res = await request(app)
        .put('/api/v1/admin/products/prod_var_test/variants')
        .set('Authorization', 'Bearer mock_owner_token')
        .send({ variants: testVariants });

      expect(res.status).toBe(200);
      const logs = getRecordedAuditLogs();
      const variantLog = logs.find(l => l.action === 'PRODUCT_VARIANTS_UPDATED' && l.targetRef === 'prod_var_test');
      expect(variantLog).toBeDefined();
      expect(variantLog?.afterState.variantCount).toBe(2);
      expect(Array.isArray(variantLog?.afterState.variants)).toBe(true);
    });

    it('Records beforeState and afterState on ORDER_STATUS_TRANSITION', async () => {
      clearRecordedAuditLogs();

      const res = await request(app)
        .post('/api/v1/admin/orders/ord_transition_1/transition')
        .set('Authorization', 'Bearer mock_owner_token')
        .send({ targetStatus: 'Confirmed', reason: 'Verified address' });

      expect(res.status).toBe(200);
      const logs = getRecordedAuditLogs();
      const transitionLog = logs.find(l => l.action === 'ORDER_STATUS_TRANSITION' && l.targetRef === 'ord_transition_1');
      expect(transitionLog).toBeDefined();
      expect(transitionLog?.beforeState.status).toBe('Pending');
      expect(transitionLog?.afterState.status).toBe('Confirmed');
    });

    it('Records beforeState and afterState on PAYMENT_ACCEPTED', async () => {
      clearRecordedAuditLogs();

      const res = await request(app)
        .post('/api/v1/admin/orders/ord_pay_1/verify-payment')
        .set('Authorization', 'Bearer mock_owner_token')
        .send({ action: 'ACCEPT', confirmBankCredit: true, receivedAmount: 900 });

      expect(res.status).toBe(200);
      const logs = getRecordedAuditLogs();
      const payLog = logs.find(l => l.action === 'PAYMENT_ACCEPTED' && l.targetRef === 'ord_pay_1');
      expect(payLog).toBeDefined();
      expect(payLog?.beforeState.paymentStatus).toBe('PAYMENT_PENDING');
      expect(payLog?.afterState.paymentStatus).toBe('PAYMENT_VERIFIED');
      expect(payLog?.afterState.receivedAmount).toBe(900);
    });

    it('Records beforeState and afterState on MESSAGE_STATUS_UPDATED', async () => {
      clearRecordedAuditLogs();

      const res = await request(app)
        .post('/api/v1/admin/messages/msg_audit_1/status')
        .set('Authorization', 'Bearer mock_owner_token')
        .send({ status: 'resolved' });

      expect(res.status).toBe(200);
      const logs = getRecordedAuditLogs();
      const msgLog = logs.find(l => l.action === 'MESSAGE_STATUS_UPDATED' && l.targetRef === 'msg_audit_1');
      expect(msgLog).toBeDefined();
      expect(msgLog?.beforeState.status).toBe('new');
      expect(msgLog?.afterState.status).toBe('resolved');
    });

    it('Records beforeState and afterState on REVIEW_MODERATED', async () => {
      clearRecordedAuditLogs();

      const res = await request(app)
        .post('/api/v1/admin/reviews/rev_audit_1/moderate')
        .set('Authorization', 'Bearer mock_owner_token')
        .send({ approved: true, moderationReason: 'Verified buyer feedback' });

      expect(res.status).toBe(200);
      const logs = getRecordedAuditLogs();
      const revLog = logs.find(l => l.action === 'REVIEW_MODERATED' && l.targetRef === 'rev_audit_1');
      expect(revLog).toBeDefined();
      expect(revLog?.beforeState.approved).toBe(false);
      expect(revLog?.afterState.approved).toBe(true);
      expect(revLog?.afterState.moderationReason).toBe('Verified buyer feedback');
    });
  });

  // ── 8. DEPLOYMENT ISOLATION (SITE VS ADMIN) ──────────────────────────────
  describe('8. Deployment Isolation (Site vs Admin)', () => {
    it('firebase.json maintains distinct targets for site and admin', () => {
      const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../firebase.json'), 'utf8'));
      const hostingTargets = firebaseConfig.hosting;

      expect(Array.isArray(hostingTargets)).toBe(true);
      expect(hostingTargets.length).toBe(2);

      const siteTarget = hostingTargets.find((t: any) => t.target === 'site');
      const adminTarget = hostingTargets.find((t: any) => t.target === 'admin');

      expect(siteTarget).toBeDefined();
      expect(siteTarget.public).toBe('public/site');

      expect(adminTarget).toBeDefined();
      expect(adminTarget.public).toBe('public/admin');
    });

    it('Admin target in firebase.json enforces noindex and no-cache headers', () => {
      const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../firebase.json'), 'utf8'));
      const adminTarget = firebaseConfig.hosting.find((t: any) => t.target === 'admin');

      const headers = adminTarget.headers[0].headers;
      const robotsHeader = headers.find((h: any) => h.key === 'X-Robots-Tag');
      const cacheHeader = headers.find((h: any) => h.key === 'Cache-Control');

      expect(robotsHeader).toBeDefined();
      expect(robotsHeader.value).toBe('noindex, nofollow, noarchive');

      expect(cacheHeader).toBeDefined();
      expect(cacheHeader.value).toBe('no-store, no-cache, must-revalidate');
    });

    it('Site bundle contains zero admin bundle scripts or admin links', () => {
      const siteHtml = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
      const siteJs = fs.readFileSync(path.join(__dirname, '../../public/site/script.js'), 'utf8');

      expect(siteHtml).not.toContain('admin.js');
      expect(siteJs).not.toContain('admin.js');
      expect(siteHtml).not.toContain('/admin/');
    });
  });

  // ── 9. FEATURE GATES & REGULATORY SAFETY ────────────────────────────────
  describe('9. Feature Gates & Regulatory Safety', () => {
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
