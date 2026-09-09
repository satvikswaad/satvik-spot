import request from 'supertest';
import * as crypto from 'crypto';
import { app } from '../src/app';
import { db } from '../src/config/firebase';
import { envConfig } from '../src/config/environment';
import { logger } from '../src/utils/logger';
import { getRecordedAuditLogs, clearRecordedAuditLogs } from '../src/audit/auditLogger';
import { requireRecentAuthentication, requireAuthenticatedUser, requireAdmin } from '../src/auth/adminMiddleware';
import { checkPermission } from '../src/admin/adminController';
import { validateCreateOrderPayload } from '../src/validation/orderSchema';
import { processAuthoritativeOrder, processWhatsAppOrderRequest } from '../src/orders/orderService';
import {
  rateLimiter,
  orderRateLimiter,
  messageRateLimiter,
  reviewRateLimiter,
  guestLookupRateLimiter,
  adminRateLimiter,
  createRouteRateLimiter
} from '../src/rateLimiting/rateLimiter';
import { AppError, ValidationError, AuthorizationError, AuthenticationError, ReauthenticationRequiredError } from '../src/errors/AppError';
import { AuthenticatedRequest } from '../src/auth/verifyAuth';

describe('Phase 5 Test Coverage & Security Audit Verification', () => {

  beforeEach(() => {
    clearRecordedAuditLogs();
    envConfig.adminAllowedIps = undefined;
    delete process.env.ADMIN_ALLOWED_IPS;
  });

  afterEach(() => {
    envConfig.adminAllowedIps = undefined;
    delete process.env.ADMIN_ALLOWED_IPS;
    clearRecordedAuditLogs();
    jest.restoreAllMocks();
  });

  // ============================================================================
  // 1. AUTH FLOWS
  // ============================================================================
  describe('1. Authentication Flows', () => {

    // ── 1.1 Customer Bearer Token Validation ──────────────────────────────────
    describe('1.1 Customer Bearer Token Validation', () => {
      it('Rejects unauthenticated customer request (missing Authorization header) with 401 UNAUTHORIZED', async () => {
        const res = await request(app).get('/api/v1/customer/profile');
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
        expect(res.body.error.message).toContain('Authentication required');
      });

      it('Rejects malformed Authorization header missing Bearer prefix with 401 UNAUTHORIZED', async () => {
        const res = await request(app)
          .get('/api/v1/customer/profile')
          .set('Authorization', 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=');

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });

      it('Rejects empty Bearer token with 401 UNAUTHORIZED', async () => {
        const res = await request(app)
          .get('/api/v1/customer/profile')
          .set('Authorization', 'Bearer ');

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });

      it('Rejects whitespace-only Bearer token with 401 UNAUTHORIZED', async () => {
        const res = await request(app)
          .get('/api/v1/customer/profile')
          .set('Authorization', 'Bearer    ');

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });

      it('Rejects revoked or invalid token with 401 UNAUTHORIZED', async () => {
        const res = await request(app)
          .get('/api/v1/customer/profile')
          .set('Authorization', 'Bearer mock_revoked_token');

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });

      it('Rejects unauthenticated request to saved addresses with 401 UNAUTHORIZED', async () => {
        const res = await request(app).get('/api/v1/customer/addresses');
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });

      it('Rejects unauthenticated request to customer order history with 401 UNAUTHORIZED', async () => {
        const res = await request(app).get('/api/v1/customer/orders');
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });

      it('Allows customer request with valid Bearer token with 200 OK', async () => {
        const res = await request(app)
          .get('/api/v1/customer/profile')
          .set('Authorization', 'Bearer mock_cust_token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.uid).toBe('cust_test_uid');
      });

      it('requireAuthenticatedUser middleware invokes next with AuthenticationError when user is missing', () => {
        const mockReq = {} as AuthenticatedRequest;
        const mockRes = {} as any;
        let caughtErr: any = null;

        requireAuthenticatedUser(mockReq, mockRes, (err: any) => {
          caughtErr = err;
        });

        expect(caughtErr).toBeInstanceOf(AuthenticationError);
        expect(caughtErr.statusCode).toBe(401);
        expect(caughtErr.errorCode).toBe('UNAUTHORIZED');
      });

      it('requireAuthenticatedUser middleware allows execution when authenticated user is present', () => {
        const mockReq = { user: { uid: 'user_active_123' } } as AuthenticatedRequest;
        const mockRes = {} as any;
        let nextCalled = false;

        requireAuthenticatedUser(mockReq, mockRes, (err?: any) => {
          expect(err).toBeUndefined();
          nextCalled = true;
        });

        expect(nextCalled).toBe(true);
      });
    });

    // ── 1.2 Admin Token Validation with Mandatory TOTP MFA Requirement ────────
    describe('1.2 Admin Token Validation with Mandatory TOTP MFA Requirement', () => {
      it('Rejects unauthenticated request to admin endpoint with 401 UNAUTHORIZED', async () => {
        const res = await request(app).get('/api/v1/admin/dashboard-summary');
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });

      it('Rejects malformed admin token with 401 UNAUTHORIZED', async () => {
        const res = await request(app)
          .get('/api/v1/admin/dashboard-summary')
          .set('Authorization', 'Basic YWRtaW46cGFzc3dvcmQ=');

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });

      it('Rejects customer token attempting admin access with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .get('/api/v1/admin/dashboard-summary')
          .set('Authorization', 'Bearer mock_cust_token');

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
        expect(res.body.error.message).toContain('Administrative privileges required');
      });

      it('Rejects admin token when MFA is not verified (mfaVerified: false) with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .get('/api/v1/admin/dashboard-summary')
          .set('Authorization', 'Bearer mock_admin_no_mfa_token');

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
        expect(res.body.error.message).toContain('Multi-Factor Authentication (MFA) verification required');
      });

      it('Rejects admin token when x-test-no-mfa is explicitly provided with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .get('/api/v1/admin/dashboard-summary')
          .set('Authorization', 'Bearer mock_admin_no_mfa_token')
          .set('x-test-no-mfa', 'true');

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
      });

      it('Allows admin request when MFA is verified with 200 OK', async () => {
        const res = await request(app)
          .get('/api/v1/admin/dashboard-summary')
          .set('Authorization', 'Bearer mock_owner_token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('requireAdmin middleware rejects non-admin users with 403 AuthorizationError', () => {
        const mockReq = {
          user: { uid: 'u1', isAdmin: false, role: 'customer', authTime: Math.floor(Date.now() / 1000), mfaVerified: false, roles: [] }
        } as AuthenticatedRequest;
        const mockRes = {} as any;
        let caughtErr: any = null;

        requireAdmin(mockReq, mockRes, (err: any) => {
          caughtErr = err;
        });

        expect(caughtErr).toBeInstanceOf(AuthorizationError);
        expect(caughtErr.statusCode).toBe(403);
        expect(caughtErr.message).toContain('Administrative privileges required');
      });
    });

    // ── 1.3 Step-Up Re-Authentication Window (300 Seconds) ────────────────────
    describe('1.3 Step-Up Re-Authentication Window (300 Seconds)', () => {
      it('Rejects sensitive operation (archive product) when authentication exceeds 300s window with 428 REAUTHENTICATION_REQUIRED', async () => {
        const res = await request(app)
          .post('/api/v1/admin/products/p_test_reauth/archive')
          .set('Authorization', 'Bearer mock_stale_auth_token');

        expect(res.status).toBe(428);
        expect(res.body.error.code).toBe('REAUTHENTICATION_REQUIRED');
        expect(res.body.error.message).toContain('Recent authentication required');
      });

      it('Rejects sensitive operation (update variants) when authentication exceeds 300s window with 428 REAUTHENTICATION_REQUIRED', async () => {
        const res = await request(app)
          .put('/api/v1/admin/products/p_test_reauth/variants')
          .set('Authorization', 'Bearer mock_stale_auth_token')
          .send({ variants: [] });

        expect(res.status).toBe(428);
        expect(res.body.error.code).toBe('REAUTHENTICATION_REQUIRED');
      });

      it('Rejects sensitive operation (order transition) when authentication exceeds 300s window with 428 REAUTHENTICATION_REQUIRED', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_test_reauth/transition')
          .set('Authorization', 'Bearer mock_stale_auth_token')
          .send({ targetStatus: 'Confirmed' });

        expect(res.status).toBe(428);
        expect(res.body.error.code).toBe('REAUTHENTICATION_REQUIRED');
      });

      it('Rejects sensitive operation (audit events viewer) when authentication exceeds 300s window with 428 REAUTHENTICATION_REQUIRED', async () => {
        const res = await request(app)
          .get('/api/v1/admin/audit-events')
          .set('Authorization', 'Bearer mock_stale_auth_token');

        expect(res.status).toBe(428);
        expect(res.body.error.code).toBe('REAUTHENTICATION_REQUIRED');
      });

      it('Allows sensitive operation when authentication is fresh (within 300 seconds) with 200 OK', async () => {
        const res = await request(app)
          .post('/api/v1/admin/products/p_test_reauth/archive')
          .set('Authorization', 'Bearer mock_owner_token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('requireRecentAuthentication middleware passes when authTime is recent', () => {
        const nowSec = Math.floor(Date.now() / 1000);
        const mockReq = {
          user: { uid: 'admin_uid', authTime: nowSec - 60 } // 60 seconds ago
        } as AuthenticatedRequest;
        const mockRes = {} as any;
        let nextCalled = false;

        const middleware = requireRecentAuthentication(300);
        middleware(mockReq, mockRes, (err?: any) => {
          expect(err).toBeUndefined();
          nextCalled = true;
        });

        expect(nextCalled).toBe(true);
      });

      it('requireRecentAuthentication middleware returns 428 when authTime exceeds limit', () => {
        const nowSec = Math.floor(Date.now() / 1000);
        const mockReq = {
          user: { uid: 'admin_uid', authTime: nowSec - 301 } // 301 seconds ago
        } as AuthenticatedRequest;
        const mockRes = {} as any;
        let caughtErr: any = null;

        const middleware = requireRecentAuthentication(300);
        middleware(mockReq, mockRes, (err: any) => {
          caughtErr = err;
        });

        expect(caughtErr).toBeInstanceOf(ReauthenticationRequiredError);
        expect(caughtErr.statusCode).toBe(428);
        expect(caughtErr.errorCode).toBe('REAUTHENTICATION_REQUIRED');
      });

      it('requireRecentAuthentication middleware returns 401 when request user is unauthenticated', () => {
        const mockReq = {} as AuthenticatedRequest;
        const mockRes = {} as any;
        let caughtErr: any = null;

        const middleware = requireRecentAuthentication(300);
        middleware(mockReq, mockRes, (err: any) => {
          caughtErr = err;
        });

        expect(caughtErr).toBeInstanceOf(AuthenticationError);
        expect(caughtErr.statusCode).toBe(401);
      });
    });
  });

  // ============================================================================
  // 2. RBAC ENFORCEMENT
  // ============================================================================
  describe('2. Role-Based Access Control (RBAC) Enforcement', () => {

    describe('2.1 checkPermission Helper Direct Verification', () => {
      it('Throws AuthorizationError when req.user is absent or isAdmin is false', () => {
        const noUserReq = {} as AuthenticatedRequest;
        expect(() => checkPermission(noUserReq, 'catalog_manager')).toThrow(AuthorizationError);

        const customerReq = { user: { uid: 'cust_1', isAdmin: false, role: 'customer' } } as AuthenticatedRequest;
        expect(() => checkPermission(customerReq, 'catalog_manager')).toThrow(AuthorizationError);
      });

      it('Throws AuthorizationError when requiredRole is missing from user roles', () => {
        const req = {
          user: { uid: 'u1', isAdmin: true, role: 'support_agent', roles: ['support_agent'] }
        } as AuthenticatedRequest;
        expect(() => checkPermission(req, 'catalog_manager')).toThrow("Insufficient permissions: 'catalog_manager' role required");
      });

      it('Passes without error when user has the exact required role', () => {
        const req = {
          user: { uid: 'u1', isAdmin: true, role: 'catalog_manager', roles: ['catalog_manager'] }
        } as AuthenticatedRequest;
        expect(() => checkPermission(req, 'catalog_manager')).not.toThrow();
      });

      it('Passes without error when user has admin_owner or owner role regardless of required role', () => {
        const reqOwner = {
          user: { uid: 'u1', isAdmin: true, role: 'admin_owner', roles: ['admin_owner', 'admin'] }
        } as AuthenticatedRequest;
        expect(() => checkPermission(reqOwner, 'catalog_manager')).not.toThrow();
        expect(() => checkPermission(reqOwner, 'order_manager')).not.toThrow();
        expect(() => checkPermission(reqOwner, 'financial_auditor')).not.toThrow();
        expect(() => checkPermission(reqOwner, 'support_agent')).not.toThrow();
      });
    });

    // ── RBAC Negative & Positive Tests: catalog_manager ───────────────────────
    describe('2.2 Role: catalog_manager', () => {
      it('POSITIVE: Allows catalog_manager to create product', async () => {
        const res = await request(app)
          .post('/api/v1/admin/products')
          .set('Authorization', 'Bearer mock_catalog_manager_token')
          .send({
            id: 'prod_cm_01',
            sku: 'SKU-CM-01',
            name: 'Aam Achar CM Edition',
            price: 260,
            stock: 30
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      });

      it('POSITIVE: Allows catalog_manager to archive product', async () => {
        const res = await request(app)
          .post('/api/v1/admin/products/prod_cm_01/archive')
          .set('Authorization', 'Bearer mock_catalog_manager_token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('POSITIVE: Allows catalog_manager to update stock', async () => {
        const res = await request(app)
          .patch('/api/v1/admin/products/prod_cm_01/stock')
          .set('Authorization', 'Bearer mock_catalog_manager_token')
          .send({ newStock: 25, reason: 'Batch production complete' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('POSITIVE: Allows catalog_manager to update variants', async () => {
        const res = await request(app)
          .put('/api/v1/admin/products/prod_cm_01/variants')
          .set('Authorization', 'Bearer mock_catalog_manager_token')
          .send({
            variants: [{ id: 'v_250', label: '250g', price: 150, mrp: 160, stock: 10, sku: 'SKU-CM-250' }]
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('NEGATIVE: Rejects catalog_manager from dashboard summary with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .get('/api/v1/admin/dashboard-summary')
          .set('Authorization', 'Bearer mock_catalog_manager_token');

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('order_manager');
      });

      it('NEGATIVE: Rejects catalog_manager from transitioning orders with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_cm_test/transition')
          .set('Authorization', 'Bearer mock_catalog_manager_token')
          .send({ targetStatus: 'Confirmed' });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('order_manager');
      });

      it('NEGATIVE: Rejects catalog_manager from verifying payment with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_cm_test/verify-payment')
          .set('Authorization', 'Bearer mock_catalog_manager_token')
          .send({ action: 'ACCEPT', confirmBankCredit: true, receivedAmount: 500 });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('financial_auditor');
      });

      it('NEGATIVE: Rejects catalog_manager from updating message status with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/messages/msg_cm_test/status')
          .set('Authorization', 'Bearer mock_catalog_manager_token')
          .send({ status: 'read' });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('support_agent');
      });

      it('NEGATIVE: Rejects catalog_manager from moderating reviews with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/reviews/rev_cm_test/moderate')
          .set('Authorization', 'Bearer mock_catalog_manager_token')
          .send({ approved: true });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('support_agent');
      });

      it('NEGATIVE: Rejects catalog_manager from accessing audit logs with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .get('/api/v1/admin/audit-events')
          .set('Authorization', 'Bearer mock_catalog_manager_token');

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('admin_owner');
      });
    });

    // ── RBAC Negative & Positive Tests: order_manager ─────────────────────────
    describe('2.3 Role: order_manager', () => {
      it('POSITIVE: Allows order_manager to access dashboard summary', async () => {
        const res = await request(app)
          .get('/api/v1/admin/dashboard-summary')
          .set('Authorization', 'Bearer mock_order_manager_token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('POSITIVE: Allows order_manager to transition order status', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_om_101/transition')
          .set('Authorization', 'Bearer mock_order_manager_token')
          .send({ targetStatus: 'Confirmed' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('NEGATIVE: Rejects order_manager from creating products with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/products')
          .set('Authorization', 'Bearer mock_order_manager_token')
          .send({
            id: 'prod_forbidden_om',
            sku: 'SKU-FORBIDDEN-OM',
            name: 'Unauthorized Pickle',
            price: 200,
            stock: 10
          });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('catalog_manager');
      });

      it('NEGATIVE: Rejects order_manager from archiving products with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/products/prod_om_test/archive')
          .set('Authorization', 'Bearer mock_order_manager_token');

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('catalog_manager');
      });

      it('NEGATIVE: Rejects order_manager from updating stock with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .patch('/api/v1/admin/products/prod_om_test/stock')
          .set('Authorization', 'Bearer mock_order_manager_token')
          .send({ newStock: 100 });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('catalog_manager');
      });

      it('NEGATIVE: Rejects order_manager from updating variants with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .put('/api/v1/admin/products/prod_om_test/variants')
          .set('Authorization', 'Bearer mock_order_manager_token')
          .send({ variants: [] });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('catalog_manager');
      });

      it('NEGATIVE: Rejects order_manager from verifying payment with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_om_101/verify-payment')
          .set('Authorization', 'Bearer mock_order_manager_token')
          .send({ action: 'ACCEPT', confirmBankCredit: true, receivedAmount: 600 });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('financial_auditor');
      });

      it('NEGATIVE: Rejects order_manager from updating message status with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/messages/msg_om_test/status')
          .set('Authorization', 'Bearer mock_order_manager_token')
          .send({ status: 'resolved' });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('support_agent');
      });

      it('NEGATIVE: Rejects order_manager from moderating reviews with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/reviews/rev_om_test/moderate')
          .set('Authorization', 'Bearer mock_order_manager_token')
          .send({ approved: true });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('support_agent');
      });

      it('NEGATIVE: Rejects order_manager from accessing audit logs with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .get('/api/v1/admin/audit-events')
          .set('Authorization', 'Bearer mock_order_manager_token');

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('admin_owner');
      });
    });

    // ── RBAC Negative & Positive Tests: financial_auditor ─────────────────────
    describe('2.4 Role: financial_auditor', () => {
      it('POSITIVE: Allows financial_auditor to verify payment (ACCEPT)', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_fa_201/verify-payment')
          .set('Authorization', 'Bearer mock_financial_auditor_token')
          .send({ action: 'ACCEPT', confirmBankCredit: true, receivedAmount: 850 });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('POSITIVE: Allows financial_auditor to verify payment (REJECT)', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_fa_202/verify-payment')
          .set('Authorization', 'Bearer mock_financial_auditor_token')
          .send({ action: 'REJECT', reasonCode: 'INVALID_UTR_REFERENCE', reason: 'UTR not found in bank statement' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('NEGATIVE: Rejects financial_auditor from dashboard summary with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .get('/api/v1/admin/dashboard-summary')
          .set('Authorization', 'Bearer mock_financial_auditor_token');

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('order_manager');
      });

      it('NEGATIVE: Rejects financial_auditor from creating products with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/products')
          .set('Authorization', 'Bearer mock_financial_auditor_token')
          .send({ id: 'prod_fa', sku: 'SKU-FA', name: 'Fa Product', price: 100, stock: 5 });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('catalog_manager');
      });

      it('NEGATIVE: Rejects financial_auditor from archiving products with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/products/prod_fa_test/archive')
          .set('Authorization', 'Bearer mock_financial_auditor_token');

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('catalog_manager');
      });

      it('NEGATIVE: Rejects financial_auditor from updating stock with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .patch('/api/v1/admin/products/prod_fa_test/stock')
          .set('Authorization', 'Bearer mock_financial_auditor_token')
          .send({ newStock: 50 });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('catalog_manager');
      });

      it('NEGATIVE: Rejects financial_auditor from transitioning order status with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_fa_test/transition')
          .set('Authorization', 'Bearer mock_financial_auditor_token')
          .send({ targetStatus: 'Confirmed' });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('order_manager');
      });

      it('NEGATIVE: Rejects financial_auditor from updating message status with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/messages/msg_fa_test/status')
          .set('Authorization', 'Bearer mock_financial_auditor_token')
          .send({ status: 'resolved' });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('support_agent');
      });

      it('NEGATIVE: Rejects financial_auditor from moderating reviews with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/reviews/rev_fa_test/moderate')
          .set('Authorization', 'Bearer mock_financial_auditor_token')
          .send({ approved: true });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('support_agent');
      });

      it('NEGATIVE: Rejects financial_auditor from accessing audit logs with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .get('/api/v1/admin/audit-events')
          .set('Authorization', 'Bearer mock_financial_auditor_token');

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('admin_owner');
      });
    });

    // ── RBAC Negative & Positive Tests: support_agent ─────────────────────────
    describe('2.5 Role: support_agent', () => {
      it('POSITIVE: Allows support_agent to update message status', async () => {
        const res = await request(app)
          .post('/api/v1/admin/messages/msg_sa_301/status')
          .set('Authorization', 'Bearer mock_support_agent_token')
          .send({ status: 'read' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('POSITIVE: Allows support_agent to moderate customer review', async () => {
        const res = await request(app)
          .post('/api/v1/admin/reviews/rev_sa_301/moderate')
          .set('Authorization', 'Bearer mock_support_agent_token')
          .send({ approved: true, moderationReason: 'Complies with guidelines' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('NEGATIVE: Rejects support_agent from dashboard summary with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .get('/api/v1/admin/dashboard-summary')
          .set('Authorization', 'Bearer mock_support_agent_token');

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('order_manager');
      });

      it('NEGATIVE: Rejects support_agent from creating products with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/products')
          .set('Authorization', 'Bearer mock_support_agent_token')
          .send({ id: 'prod_sa', sku: 'SKU-SA', name: 'Sa Product', price: 150, stock: 10 });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('catalog_manager');
      });

      it('NEGATIVE: Rejects support_agent from modifying inventory stock with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .patch('/api/v1/admin/products/prod_sa_test/stock')
          .set('Authorization', 'Bearer mock_support_agent_token')
          .send({ newStock: 80 });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('catalog_manager');
      });

      it('NEGATIVE: Rejects support_agent from transitioning order status with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_sa_test/transition')
          .set('Authorization', 'Bearer mock_support_agent_token')
          .send({ targetStatus: 'Confirmed' });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('order_manager');
      });

      it('NEGATIVE: Rejects support_agent from verifying payments with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_sa_test/verify-payment')
          .set('Authorization', 'Bearer mock_support_agent_token')
          .send({ action: 'ACCEPT', confirmBankCredit: true, receivedAmount: 500 });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('financial_auditor');
      });

      it('NEGATIVE: Rejects support_agent from accessing audit logs with 403 FORBIDDEN', async () => {
        const res = await request(app)
          .get('/api/v1/admin/audit-events')
          .set('Authorization', 'Bearer mock_support_agent_token');

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('admin_owner');
      });
    });

    // ── RBAC Positive Superuser Tests: admin_owner ────────────────────────────
    describe('2.6 Role: admin_owner (Superuser)', () => {
      it('POSITIVE: Allows admin_owner to access dashboard summary', async () => {
        const res = await request(app)
          .get('/api/v1/admin/dashboard-summary')
          .set('Authorization', 'Bearer mock_owner_token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('POSITIVE: Allows admin_owner to create products', async () => {
        const res = await request(app)
          .post('/api/v1/admin/products')
          .set('Authorization', 'Bearer mock_owner_token')
          .send({ id: 'prod_ao_1', sku: 'SKU-AO-1', name: 'Owner Pickle', price: 300, stock: 50 });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      });

      it('POSITIVE: Allows admin_owner to archive products', async () => {
        const res = await request(app)
          .post('/api/v1/admin/products/prod_ao_1/archive')
          .set('Authorization', 'Bearer mock_owner_token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('POSITIVE: Allows admin_owner to update inventory stock', async () => {
        const res = await request(app)
          .patch('/api/v1/admin/products/prod_ao_1/stock')
          .set('Authorization', 'Bearer mock_owner_token')
          .send({ newStock: 65, reason: 'Owner stock adjustment' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('POSITIVE: Allows admin_owner to update product variants', async () => {
        const res = await request(app)
          .put('/api/v1/admin/products/prod_ao_1/variants')
          .set('Authorization', 'Bearer mock_owner_token')
          .send({ variants: [{ id: 'var_ao', label: '500g', price: 300, mrp: 350, stock: 20, sku: 'SKU-AO-500' }] });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('POSITIVE: Allows admin_owner to transition order status', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_ao_1/transition')
          .set('Authorization', 'Bearer mock_owner_token')
          .send({ targetStatus: 'Confirmed' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('POSITIVE: Allows admin_owner to verify payments', async () => {
        const res = await request(app)
          .post('/api/v1/admin/orders/ord_ao_1/verify-payment')
          .set('Authorization', 'Bearer mock_owner_token')
          .send({ action: 'ACCEPT', confirmBankCredit: true, receivedAmount: 1500 });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('POSITIVE: Allows admin_owner to update customer message status', async () => {
        const res = await request(app)
          .post('/api/v1/admin/messages/msg_ao_1/status')
          .set('Authorization', 'Bearer mock_owner_token')
          .send({ status: 'resolved' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('POSITIVE: Allows admin_owner to moderate customer reviews', async () => {
        const res = await request(app)
          .post('/api/v1/admin/reviews/rev_ao_1/moderate')
          .set('Authorization', 'Bearer mock_owner_token')
          .send({ approved: true, moderationReason: 'Approved by admin owner' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('POSITIVE: Allows admin_owner to view audit events', async () => {
        const res = await request(app)
          .get('/api/v1/admin/audit-events')
          .set('Authorization', 'Bearer mock_owner_token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.logs)).toBe(true);
      });
    });
  });

  // ============================================================================
  // 3. IDEMPOTENCY
  // ============================================================================
  describe('3. Idempotency Key Validation & State Protection', () => {

    // ── 3.1 Key Length and Schema Constraints (8-64 characters) ───────────────
    describe('3.1 Key Length and Schema Constraints (8-64 characters)', () => {
      const baseValidPayload = {
        name: 'Rajesh Kumar',
        phone: '9876543210',
        address: '123 Temple Road, Banjara Hills, Hyderabad, Telangana - 500034',
        paymentMethod: 'UPI_MANUAL',
        items: [{ productId: 'prod_aam_achar', qty: 2 }]
      };

      it('Rejects payload with missing idempotencyKey with ValidationError', () => {
        expect(() => {
          validateCreateOrderPayload({
            ...baseValidPayload
          });
        }).toThrow('Valid idempotencyKey required (8-64 characters)');
      });

      it('Rejects idempotencyKey with length < 8 characters with ValidationError', () => {
        expect(() => {
          validateCreateOrderPayload({
            ...baseValidPayload,
            idempotencyKey: 'short'
          });
        }).toThrow('Valid idempotencyKey required (8-64 characters)');
      });

      it('Rejects idempotencyKey with length > 64 characters with ValidationError', () => {
        expect(() => {
          validateCreateOrderPayload({
            ...baseValidPayload,
            idempotencyKey: 'a'.repeat(65)
          });
        }).toThrow('Valid idempotencyKey required (8-64 characters)');
      });

      it('Rejects non-string idempotencyKey (number, boolean, object) with ValidationError', () => {
        expect(() => {
          validateCreateOrderPayload({
            ...baseValidPayload,
            idempotencyKey: 123456789 as any
          });
        }).toThrow('Valid idempotencyKey required (8-64 characters)');

        expect(() => {
          validateCreateOrderPayload({
            ...baseValidPayload,
            idempotencyKey: true as any
          });
        }).toThrow('Valid idempotencyKey required (8-64 characters)');
      });

      it('Accepts valid idempotencyKey at lower boundary (8 characters)', () => {
        const validated = validateCreateOrderPayload({
          ...baseValidPayload,
          idempotencyKey: '12345678'
        });
        expect(validated.idempotencyKey).toBe('12345678');
      });

      it('Accepts valid idempotencyKey with UUID (36 characters)', () => {
        const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        const validated = validateCreateOrderPayload({
          ...baseValidPayload,
          idempotencyKey: uuid
        });
        expect(validated.idempotencyKey).toBe(uuid);
      });

      it('Accepts valid idempotencyKey at upper boundary (64 characters)', () => {
        const maxKey = 'k'.repeat(64);
        const validated = validateCreateOrderPayload({
          ...baseValidPayload,
          idempotencyKey: maxKey
        });
        expect(validated.idempotencyKey).toBe(maxKey);
      });

      it('POST /api/v1/orders/create rejects request missing idempotencyKey with 400 VALIDATION_ERROR', async () => {
        envConfig.commerceEnabled = true;
        envConfig.checkoutEnabled = true;

        const res = await request(app)
          .post('/api/v1/orders/create')
          .send({
            name: 'Rajesh Kumar',
            phone: '9876543210',
            address: '123 Temple Road, Banjara Hills, Hyderabad, Telangana - 500034',
            paymentMethod: 'UPI_MANUAL',
            items: [{ productId: 'prod_aam_achar', qty: 2 }]
          });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.message).toContain('idempotencyKey');

        envConfig.commerceEnabled = false;
        envConfig.checkoutEnabled = false;
      });

      it('POST /api/v1/orders/create rejects request with invalid idempotencyKey length with 400 VALIDATION_ERROR', async () => {
        envConfig.commerceEnabled = true;
        envConfig.checkoutEnabled = true;

        const res = await request(app)
          .post('/api/v1/orders/create')
          .send({
            name: 'Rajesh Kumar',
            phone: '9876543210',
            address: '123 Temple Road, Banjara Hills, Hyderabad, Telangana - 500034',
            paymentMethod: 'UPI_MANUAL',
            items: [{ productId: 'prod_aam_achar', qty: 2 }],
            idempotencyKey: 'short' // 5 chars, strictly < 8
          });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');

        envConfig.commerceEnabled = false;
        envConfig.checkoutEnabled = false;
      });

      it('POST /api/v1/orders/create rejects request with idempotencyKey length > 64 with 400 VALIDATION_ERROR', async () => {
        envConfig.commerceEnabled = true;
        envConfig.checkoutEnabled = true;

        const res = await request(app)
          .post('/api/v1/orders/create')
          .send({
            name: 'Rajesh Kumar',
            phone: '9876543210',
            address: '123 Temple Road, Banjara Hills, Hyderabad, Telangana - 500034',
            paymentMethod: 'UPI_MANUAL',
            items: [{ productId: 'prod_aam_achar', qty: 2 }],
            idempotencyKey: 'x'.repeat(65)
          });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');

        envConfig.commerceEnabled = false;
        envConfig.checkoutEnabled = false;
      });
    });

    // ── 3.2 Replay Handling: Returning Cached Response on Identical Submission ──
    describe('3.2 Replay Handling: Returning Cached Response on Identical Payload', () => {
      const testPayload = {
        name: 'Sita Ram',
        phone: '9876543210',
        address: '456 Heritage Lane, Somajiguda, Hyderabad, Telangana - 500082',
        paymentMethod: 'UPI_MANUAL' as const,
        items: [{ productId: 'prod_aam_achar', qty: 1 }],
        idempotencyKey: 'idemp-replay-key-001'
      };

      // Compute deterministic request hash matching orderService.ts
      function computeHash(payload: typeof testPayload): string {
        const canonical = JSON.stringify({
          name: payload.name,
          phone: payload.phone,
          address: payload.address,
          paymentMethod: payload.paymentMethod,
          items: payload.items
            .map(item => ({ productId: item.productId, variantId: '', qty: item.qty }))
            .sort((a, b) => a.productId.localeCompare(b.productId))
        });
        return crypto.createHash('sha256').update(canonical).digest('hex');
      }

      it('Returns cached order creation result on identical replay without side-effects', async () => {
        const requestHash = computeHash(testPayload);
        const ownerId = 'cust_replay_uid';
        const action = 'api/v1/orders/create';

        const cachedResult = {
          orderId: 'ORD-CACHED-REPLAY-100',
          total: 350,
          subtotal: 300,
          shippingFee: 50,
          status: 'Pending',
          paymentStatus: 'PAYMENT_PENDING',
          createdAt: '2026-09-06T10:00:00.000Z'
        };

        const mockTransaction = {
          get: jest.fn().mockImplementation(async (ref: any) => {
            return {
              exists: true,
              data: () => ({
                ownerId,
                action,
                requestHash,
                result: cachedResult
              })
            };
          }),
          set: jest.fn(),
          update: jest.fn()
        };

        jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
          return await cb(mockTransaction);
        });

        const result = await processAuthoritativeOrder({
          payload: testPayload,
          userId: ownerId
        });

        expect(result).toEqual(cachedResult);
        expect(mockTransaction.set).not.toHaveBeenCalled();
        expect(mockTransaction.update).not.toHaveBeenCalled();
      });

      it('WhatsApp order creation returns cached response on identical replay', async () => {
        const requestHash = computeHash(testPayload);
        const ownerId = 'cust_replay_uid';
        const action = 'api/v1/orders/create-whatsapp-request';

        const cachedWhatsAppResult = {
          orderId: 'ORD-WA-CACHED-100',
          total: 350,
          subtotal: 300,
          shippingFee: 50,
          whatsappUrl: 'https://wa.me/919876543210?text=Hello',
          createdAt: '2026-09-06T10:00:00.000Z'
        };

        const mockTransaction = {
          get: jest.fn().mockImplementation(async () => {
            return {
              exists: true,
              data: () => ({
                ownerId,
                action,
                requestHash,
                result: cachedWhatsAppResult
              })
            };
          }),
          set: jest.fn(),
          update: jest.fn()
        };

        jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
          return await cb(mockTransaction);
        });

        const result = await processWhatsAppOrderRequest({
          payload: testPayload,
          userId: ownerId
        });

        expect(result).toEqual(cachedWhatsAppResult);
        expect(mockTransaction.set).not.toHaveBeenCalled();
      });
    });

    // ── 3.3 Conflict Handling: Rejecting Payload Modifications ────────────────
    describe('3.3 Conflict Handling: Rejecting Payload Modifications (409 IDEMPOTENCY_CONFLICT)', () => {
      const originalPayload = {
        name: 'Anita Devi',
        phone: '9876543210',
        address: '789 Charminar Road, Old City, Hyderabad, Telangana - 500002',
        paymentMethod: 'UPI_MANUAL' as const,
        items: [{ productId: 'prod_nimbu_achar', qty: 1 }],
        idempotencyKey: 'idemp-conflict-key-002'
      };

      const modifiedPayload = {
        ...originalPayload,
        items: [{ productId: 'prod_nimbu_achar', qty: 5 }] // modified quantity
      };

      it('Rejects payload modifications with 409 IDEMPOTENCY_CONFLICT when key is reused with different items', async () => {
        const ownerId = 'cust_conflict_uid';
        const action = 'api/v1/orders/create';
        const originalHash = 'sha256_original_hash_value_11111111111111111111111111111111';

        const mockTransaction = {
          get: jest.fn().mockImplementation(async () => {
            return {
              exists: true,
              data: () => ({
                ownerId,
                action,
                requestHash: originalHash,
                result: { orderId: 'ORD-ORIGINAL-001' }
              })
            };
          }),
          set: jest.fn(),
          update: jest.fn()
        };

        jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
          return await cb(mockTransaction);
        });

        await expect(
          processAuthoritativeOrder({
            payload: modifiedPayload,
            userId: ownerId
          })
        ).rejects.toMatchObject({
          statusCode: 409,
          errorCode: 'IDEMPOTENCY_CONFLICT',
          message: 'Idempotency key reused with a different order payload or identity'
        });
      });

      it('Rejects WhatsApp order modifications with 409 IDEMPOTENCY_CONFLICT', async () => {
        const ownerId = 'cust_conflict_uid';
        const action = 'api/v1/orders/create-whatsapp-request';
        const originalHash = 'sha256_original_hash_value_22222222222222222222222222222222';

        const mockTransaction = {
          get: jest.fn().mockImplementation(async () => {
            return {
              exists: true,
              data: () => ({
                ownerId,
                action,
                requestHash: originalHash,
                result: { orderId: 'ORD-WA-ORIGINAL-001' }
              })
            };
          }),
          set: jest.fn(),
          update: jest.fn()
        };

        jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
          return await cb(mockTransaction);
        });

        await expect(
          processWhatsAppOrderRequest({
            payload: modifiedPayload,
            userId: ownerId
          })
        ).rejects.toMatchObject({
          statusCode: 409,
          errorCode: 'IDEMPOTENCY_CONFLICT'
        });
      });
    });

    // ── 3.4 Identity Binding: Rejecting Cross-Identity Key Reuse ───────────────
    describe('3.4 Identity Binding: Rejecting Cross-Identity Key Reuse', () => {
      const orderPayload = {
        name: 'Pooja Verma',
        phone: '9876543210',
        address: '101 Cyber Towers, Hitec City, Hyderabad, Telangana - 500081',
        paymentMethod: 'UPI_MANUAL' as const,
        items: [{ productId: 'prod_aam_achar', qty: 1 }],
        idempotencyKey: 'idemp-identity-binding-key'
      };

      it('Rejects cross-identity key reuse when another user supplies identical payload with 409 IDEMPOTENCY_CONFLICT', async () => {
        // Hash will match, but ownerId will be different
        const canonical = JSON.stringify({
          name: orderPayload.name,
          phone: orderPayload.phone,
          address: orderPayload.address,
          paymentMethod: orderPayload.paymentMethod,
          items: orderPayload.items
            .map(item => ({ productId: item.productId, variantId: '', qty: item.qty }))
            .sort((a, b) => a.productId.localeCompare(b.productId))
        });
        const requestHash = crypto.createHash('sha256').update(canonical).digest('hex');

        const cachedOwnerId = 'user_victim_123';
        const attackingOwnerId = 'user_attacker_456';
        const action = 'api/v1/orders/create';

        const mockTransaction = {
          get: jest.fn().mockImplementation(async () => {
            return {
              exists: true,
              data: () => ({
                ownerId: cachedOwnerId,
                action,
                requestHash,
                result: { orderId: 'ORD-LEGIT-101' }
              })
            };
          }),
          set: jest.fn(),
          update: jest.fn()
        };

        jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
          return await cb(mockTransaction);
        });

        await expect(
          processAuthoritativeOrder({
            payload: orderPayload,
            userId: attackingOwnerId // Different identity attempting to reuse victim's key
          })
        ).rejects.toMatchObject({
          statusCode: 409,
          errorCode: 'IDEMPOTENCY_CONFLICT',
          message: 'Idempotency key reused with a different order payload or identity'
        });
      });

      it('Rejects key reuse across different action endpoints with 409 IDEMPOTENCY_CONFLICT', async () => {
        const canonical = JSON.stringify({
          name: orderPayload.name,
          phone: orderPayload.phone,
          address: orderPayload.address,
          paymentMethod: orderPayload.paymentMethod,
          items: orderPayload.items
            .map(item => ({ productId: item.productId, variantId: '', qty: item.qty }))
            .sort((a, b) => a.productId.localeCompare(b.productId))
        });
        const requestHash = crypto.createHash('sha256').update(canonical).digest('hex');
        const ownerId = 'user_shared_123';

        const mockTransaction = {
          get: jest.fn().mockImplementation(async () => {
            return {
              exists: true,
              data: () => ({
                ownerId,
                action: 'api/v1/orders/create-whatsapp-request', // bound to whatsapp action
                requestHash,
                result: { orderId: 'ORD-WA-101' }
              })
            };
          }),
          set: jest.fn(),
          update: jest.fn()
        };

        jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
          return await cb(mockTransaction);
        });

        // Calling processAuthoritativeOrder which uses action: 'api/v1/orders/create'
        await expect(
          processAuthoritativeOrder({
            payload: orderPayload,
            userId: ownerId
          })
        ).rejects.toMatchObject({
          statusCode: 409,
          errorCode: 'IDEMPOTENCY_CONFLICT'
        });
      });
    });
  });

  // ============================================================================
  // 4. RATE LIMITING
  // ============================================================================
  describe('4. Rate Limiting & Violation Audit Logging', () => {

    // Helper to test route rate limiter directly
    async function executeRateLimiterTest(
      limiterMiddleware: any,
      reqOptions: { ip?: string; url?: string },
      exceededCount: number,
      maxLimit: number
    ) {
      const origEnv = process.env.NODE_ENV;
      const origWorker = process.env.JEST_WORKER_ID;

      delete (process.env as any).JEST_WORKER_ID;
      (process.env as any).NODE_ENV = 'production';

      const runTxSpy = jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
        const fakeSnap = {
          exists: true,
          data: () => ({ count: exceededCount })
        };
        const fakeTx = {
          get: jest.fn().mockResolvedValue(fakeSnap),
          set: jest.fn(),
          update: jest.fn()
        };
        return await cb(fakeTx);
      });

      const mockReq: any = {
        ip: reqOptions.ip || '203.0.113.50',
        originalUrl: reqOptions.url || '/api/v1/test',
        user: { uid: 'user_rate_limit_test' }
      };
      const mockRes: any = {};
      let caughtError: any = null;

      await limiterMiddleware(mockReq, mockRes, (err: any) => {
        caughtError = err;
      });

      (process.env as any).NODE_ENV = origEnv;
      if (origWorker !== undefined) {
        (process.env as any).JEST_WORKER_ID = origWorker;
      }
      runTxSpy.mockRestore();

      return caughtError;
    }

    it('orderRateLimiter emits HTTP 429 RATE_LIMIT_EXCEEDED when 5 req/min threshold is exceeded', async () => {
      const err = await executeRateLimiterTest(orderRateLimiter, { url: '/api/v1/orders/create' }, 5, 5);
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(429);
      expect(err.errorCode).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('messageRateLimiter emits HTTP 429 RATE_LIMIT_EXCEEDED when 5 req/min threshold is exceeded', async () => {
      const err = await executeRateLimiterTest(messageRateLimiter, { url: '/api/v1/messages' }, 5, 5);
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(429);
      expect(err.errorCode).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('reviewRateLimiter emits HTTP 429 RATE_LIMIT_EXCEEDED when 10 req/min threshold is exceeded', async () => {
      const err = await executeRateLimiterTest(reviewRateLimiter, { url: '/api/v1/reviews' }, 10, 10);
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(429);
      expect(err.errorCode).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('guestLookupRateLimiter emits HTTP 429 RATE_LIMIT_EXCEEDED when 10 req/min threshold is exceeded', async () => {
      const err = await executeRateLimiterTest(guestLookupRateLimiter, { url: '/api/v1/orders/guest-lookup' }, 10, 10);
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(429);
      expect(err.errorCode).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('adminRateLimiter emits HTTP 429 RATE_LIMIT_EXCEEDED when 30 req/min threshold is exceeded', async () => {
      const err = await executeRateLimiterTest(adminRateLimiter, { url: '/api/v1/admin/dashboard-summary' }, 30, 30);
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(429);
      expect(err.errorCode).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('Global rateLimiter emits HTTP 429 RATE_LIMIT_EXCEEDED when 60 req/min threshold is exceeded', async () => {
      const err = await executeRateLimiterTest(rateLimiter, { url: '/api/v1/public-endpoint' }, 60, 60);
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(429);
      expect(err.errorCode).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('Security audit logger captures violation metadata on rate limit breach', async () => {
      clearRecordedAuditLogs();
      const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => logger);

      const customLimiter = createRouteRateLimiter({
        windowMs: 60000,
        maxRequests: 3,
        routeIdentifier: 'test_audit_route'
      });

      const err = await executeRateLimiterTest(
        customLimiter,
        { ip: '198.51.100.99', url: '/api/v1/audit-test' },
        3,
        3
      );

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(429);

      // Verify logger.warn was called with complete violation details
      expect(warnSpy).toHaveBeenCalledWith(
        'Rate limit violation detected',
        expect.objectContaining({
          routeIdentifier: 'test_audit_route',
          clientIp: '198.51.100.99',
          count: 4,
          maxRequests: 3,
          windowMs: 60000,
          url: '/api/v1/audit-test'
        })
      );

      // Verify append-only audit event service captured the event
      const logs = getRecordedAuditLogs();
      const rateLimitAudit = logs.find(l => l.action === 'RATE_LIMIT_EXCEEDED');
      expect(rateLimitAudit).toBeDefined();
      expect(rateLimitAudit?.outcome).toBe('DENIED');
      expect(rateLimitAudit?.ip).toBe('198.51.100.99');
      expect(rateLimitAudit?.details).toEqual(
        expect.objectContaining({
          routeIdentifier: 'test_audit_route',
          clientIp: '198.51.100.99',
          count: 4,
          maxRequests: 3,
          windowMs: 60000,
          url: '/api/v1/audit-test'
        })
      );

      warnSpy.mockRestore();
    });
  });
});
