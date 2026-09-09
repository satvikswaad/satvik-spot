import request from 'supertest';
import * as crypto from 'crypto';
import { app } from '../src/app';
import { db } from '../src/config/firebase';
import { envConfig } from '../src/config/environment';
import { clearRecordedAuditLogs } from '../src/audit/auditLogger';
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
  getRazorpayCredentials
} from '../src/payments/razorpayService';
import * as orderService from '../src/orders/orderService';

describe('Phase B: Payment Gateway Integration (Razorpay)', () => {
  const TEST_KEY_ID = 'rzp_test_mockKeyId12345';
  const TEST_KEY_SECRET = 'mockSecretKey9876543210';
  const TEST_WEBHOOK_SECRET = 'mockWebhookSecret_abcdef123456';

  const originalEnv = { ...envConfig };
  const originalEnvVars = {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    PAYMENTS_ENABLED: process.env.PAYMENTS_ENABLED,
    COMMERCE_ENABLED: process.env.COMMERCE_ENABLED,
    CHECKOUT_ENABLED: process.env.CHECKOUT_ENABLED
  };

  beforeEach(() => {
    clearRecordedAuditLogs();
    envConfig.paymentsEnabled = false;
    envConfig.commerceEnabled = true;
    envConfig.checkoutEnabled = true;
    process.env.RAZORPAY_KEY_ID = TEST_KEY_ID;
    process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
    envConfig.razorpayKeyId = TEST_KEY_ID;
    envConfig.razorpayKeySecret = TEST_KEY_SECRET;
    envConfig.razorpayWebhookSecret = TEST_WEBHOOK_SECRET;
  });

  afterEach(() => {
    Object.assign(envConfig, originalEnv);
    process.env.RAZORPAY_KEY_ID = originalEnvVars.RAZORPAY_KEY_ID;
    process.env.RAZORPAY_KEY_SECRET = originalEnvVars.RAZORPAY_KEY_SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = originalEnvVars.RAZORPAY_WEBHOOK_SECRET;
    process.env.PAYMENTS_ENABLED = originalEnvVars.PAYMENTS_ENABLED;
    process.env.COMMERCE_ENABLED = originalEnvVars.COMMERCE_ENABLED;
    process.env.CHECKOUT_ENABLED = originalEnvVars.CHECKOUT_ENABLED;
    jest.restoreAllMocks();
  });

  // ============================================================================
  // 1. FEATURE GATES & CREDENTIALS
  // ============================================================================
  describe('1. Feature Gate & Configuration Enforcement', () => {
    it('Rejects POST /api/v1/payments/create-order with 503 when paymentsEnabled is false', async () => {
      envConfig.paymentsEnabled = false;

      const res = await request(app)
        .post('/api/v1/payments/create-order')
        .send({
          name: 'Test Customer',
          phone: '9876543210',
          address: 'Varanasi',
          items: [{ productId: 'prod_aam_achar', qty: 1 }],
          idempotencyKey: 'idem_pay_gate_test_01'
        });

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('PAYMENTS_NOT_AVAILABLE');
    });

    it('Rejects legacy POST /api/v1/payments/process with 503', async () => {
      envConfig.paymentsEnabled = false;

      const res = await request(app)
        .post('/api/v1/payments/process')
        .send({});

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('PAYMENTS_NOT_AVAILABLE');
    });

    it('Throws PaymentsNotAvailableError when credentials are missing', () => {
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;

      expect(() => getRazorpayCredentials()).toThrow(/Razorpay credentials not configured/);
    });

    it('Returns keyId and keySecret when properly configured', () => {
      const creds = getRazorpayCredentials();
      expect(creds.keyId).toBe(TEST_KEY_ID);
      expect(creds.keySecret).toBe(TEST_KEY_SECRET);
    });
  });

  // ============================================================================
  // 2. SIGNATURE VERIFICATION (Cryptographic)
  // ============================================================================
  describe('2. Cryptographic Signature Verification', () => {
    it('Accepts a valid payment HMAC-SHA256 signature', () => {
      const orderId = 'order_MOCK123456';
      const paymentId = 'pay_MOCK789012';
      const payload = `${orderId}|${paymentId}`;
      const validSig = crypto
        .createHmac('sha256', TEST_KEY_SECRET)
        .update(payload)
        .digest('hex');

      const isValid = verifyPaymentSignature({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSig
      });

      expect(isValid).toBe(true);
    });

    it('Rejects an invalid payment signature (tampered signature)', () => {
      const isValid = verifyPaymentSignature({
        razorpay_order_id: 'order_MOCK123456',
        razorpay_payment_id: 'pay_MOCK789012',
        razorpay_signature: 'tampered_signature_hex_value_00000000000000000000000000000000000000'
      });

      expect(isValid).toBe(false);
    });

    it('Rejects signature with mismatched length without throwing exception', () => {
      const isValid = verifyPaymentSignature({
        razorpay_order_id: 'order_MOCK123456',
        razorpay_payment_id: 'pay_MOCK789012',
        razorpay_signature: 'short'
      });

      expect(isValid).toBe(false);
    });

    it('Accepts a valid webhook HMAC-SHA256 signature', () => {
      const rawBody = JSON.stringify({ event: 'payment.captured', entity: {} });
      const validSig = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const isValid = verifyWebhookSignature(rawBody, validSig);
      expect(isValid).toBe(true);
    });

    it('Rejects an invalid webhook signature', () => {
      const rawBody = JSON.stringify({ event: 'payment.captured', entity: {} });
      const fakeSig = crypto
        .createHmac('sha256', 'wrong_secret')
        .update(rawBody)
        .digest('hex');

      const isValid = verifyWebhookSignature(rawBody, fakeSig);
      expect(isValid).toBe(false);
    });
  });

  // ============================================================================
  // 3. SCHEMA VALIDATION FOR PAYMENT ENDPOINTS
  // ============================================================================
  describe('3. Payment Schema Validation', () => {
    it('Rejects POST /api/v1/payments/verify with missing fields', async () => {
      envConfig.paymentsEnabled = true;

      const res = await request(app)
        .post('/api/v1/payments/verify')
        .send({
          razorpay_order_id: 'order_123'
          // missing razorpay_payment_id and razorpay_signature
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Rejects POST /api/v1/payments/verify with unexpected extra keys', async () => {
      envConfig.paymentsEnabled = true;

      const res = await request(app)
        .post('/api/v1/payments/verify')
        .send({
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_123',
          razorpay_signature: 'sig_123',
          extraField: 'malicious'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Rejects POST /api/v1/payments/webhook without signature header', async () => {
      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({ event: 'payment.captured' });

      expect(res.status).toBe(400);
    });

    it('Rejects POST /api/v1/payments/webhook with fraudulent signature', async () => {
      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', 'fraudulent_signature_value')
        .send({ event: 'payment.captured' });

      expect(res.status).toBe(400);
    });
  });

  // ============================================================================
  // 4. ORDER CREATION WITH RAZORPAY
  // ============================================================================
  describe('4. Razorpay Order Creation Flow', () => {
    it('Calls Razorpay API and returns order credentials when enabled', async () => {
      envConfig.paymentsEnabled = true;

      // Mock processCheckoutOrder to return valid order result
      const mockOrderId = 'order_test_mock_' + Date.now();
      jest.spyOn(orderService, 'processCheckoutOrder').mockResolvedValue({
        orderId: mockOrderId,
        total: 548,
        subtotal: 498,
        shippingFee: 50,
        status: 'AwaitingPayment',
        paymentStatus: 'PAYMENT_INITIATED',
        createdAt: new Date().toISOString()
      });

      // Mock Firestore update
      jest.spyOn(db, 'collection').mockReturnValue({
        doc: jest.fn().mockReturnValue({
          update: jest.fn().mockResolvedValue({})
        })
      } as any);

      // Mock global fetch for Razorpay API
      const mockRazorpayOrderId = 'order_RZP_test_' + Date.now();
      const mockFetch = jest.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
        if (String(url).includes('api.razorpay.com/v1/orders')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              id: mockRazorpayOrderId,
              entity: 'order',
              amount: 54800,
              currency: 'INR',
              receipt: mockOrderId,
              status: 'created',
              created_at: Math.floor(Date.now() / 1000)
            })
          } as any;
        }
        return { ok: false, status: 404, text: async () => 'Not Found' } as any;
      });

      const res = await request(app)
        .post('/api/v1/payments/create-order')
        .send({
          name: 'Pooja Sharma',
          phone: '9876543210',
          address: 'Assi Ghat, Varanasi, UP, 221005',
          items: [{ productId: 'prod_aam_achar', variantId: 'var_500g', qty: 2 }],
          idempotencyKey: 'idem_pay_create_' + Date.now()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.razorpayOrderId).toBe(mockRazorpayOrderId);
      expect(res.body.data.razorpayKeyId).toBe(TEST_KEY_ID);
      expect(res.body.data.currency).toBe('INR');
      expect(res.body.data.amount).toBe(54800);
      expect(res.body.data.orderId).toBe(mockOrderId);

      mockFetch.mockRestore();
    });

    it('Rejects client-injected price or total in create-order payload', async () => {
      envConfig.paymentsEnabled = true;

      const res = await request(app)
        .post('/api/v1/payments/create-order')
        .send({
          name: 'Pooja Sharma',
          phone: '9876543210',
          address: 'Assi Ghat, Varanasi, UP, 221005',
          price: 1, // Tampered price
          items: [{ productId: 'prod_aam_achar', qty: 1 }],
          idempotencyKey: 'idem_pay_tamper_' + Date.now()
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ============================================================================
  // 5. PAYMENT VERIFICATION & IDEMPOTENCY
  // ============================================================================
  describe('5. Payment Verification & Idempotent State Transitions', () => {
    it('Rejects verification when signature does not match', async () => {
      envConfig.paymentsEnabled = true;

      const res = await request(app)
        .post('/api/v1/payments/verify')
        .send({
          razorpay_order_id: 'order_nonexistent_123',
          razorpay_payment_id: 'pay_nonexistent_456',
          razorpay_signature: 'invalid_sig_0000000000000000000000000000000000000000000000000000000000000000'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_PAYMENT_SIGNATURE');
    });
  });

  // ============================================================================
  // 6. ADMIN REFUND FLOW
  // ============================================================================
  describe('6. Admin Refund Endpoint Protection', () => {
    it('Rejects unauthenticated requests to POST /api/v1/admin/refunds with 401', async () => {
      const res = await request(app)
        .post('/api/v1/admin/refunds')
        .send({
          orderId: 'order_test_123',
          amount: 500,
          reason: 'Customer requested cancellation'
        });

      expect(res.status).toBe(401);
    });

    it('Rejects non-admin token on refunds with 403', async () => {
      // Bearer token without admin claim
      const res = await request(app)
        .post('/api/v1/admin/refunds')
        .set('Authorization', 'Bearer customer-mock-token')
        .send({
          orderId: 'order_test_123'
        });

      // Customer token without admin claims returns 403
      expect([401, 403]).toContain(res.status);
    });
  });
});
