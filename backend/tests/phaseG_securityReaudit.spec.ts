import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { app } from '../src/app';
import { verifyPaymentSignature, verifyWebhookSignature } from '../src/payments/razorpayService';

describe('Phase G: Full-Stack Security Re-Audit & Production Sign-Off', () => {

  // ============================================================================
  // 1. FIRESTORE SECURITY RULES COMPREHENSIVE DENIAL AUDIT
  // ============================================================================
  describe('1. Firestore Security Rules Denial Audit', () => {
    const rulesPath = path.join(__dirname, '../../firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    it('Default deny-all rule exists for all unspecified documents', () => {
      expect(rulesContent).toContain('match /{document=**} {');
      expect(rulesContent).toContain('allow read, write: if false;');
    });

    it('Denies direct client creation, updating, and deletion of orders', () => {
      expect(rulesContent).toContain('match /orders/{orderId} {');
      expect(rulesContent).toContain('allow create: if false;');
      expect(rulesContent).toContain('allow update, delete: if false;');
    });

    it('Denies direct client writes to payment_transactions', () => {
      expect(rulesContent).toContain('match /payment_transactions/{txnId} {');
      expect(rulesContent).toContain('allow create, update, delete: if false;');
    });

    it('Denies direct client writes to refunds', () => {
      expect(rulesContent).toContain('match /refunds/{refundId} {');
      expect(rulesContent).toContain('allow create, update, delete: if false;');
    });

    it('Denies direct client writes to inventory_logs', () => {
      expect(rulesContent).toContain('match /inventory_logs/{logId} {');
      expect(rulesContent).toContain('allow create, update, delete: if false;');
    });

    it('Denies direct client writes to audit_logs', () => {
      expect(rulesContent).toContain('match /audit_logs/{logId} {');
      expect(rulesContent).toContain('allow create, update, delete: if false;');
    });

    it('Denies all client access to idempotency records', () => {
      expect(rulesContent).toContain('match /idempotency/{id} {');
      expect(rulesContent).toContain('allow read, write: if false;');
    });

    it('Denies all client access to rate limit buckets', () => {
      expect(rulesContent).toContain('match /rate_limits/{bucket} {');
      expect(rulesContent).toContain('allow read, write: if false;');
    });

    it('Prevents privilege escalation on user & customer profiles', () => {
      expect(rulesContent).toContain("!('admin' in request.resource.data)");
      expect(rulesContent).toContain("!('role' in request.resource.data)");
      expect(rulesContent).toContain("!('roles' in request.resource.data)");
      expect(rulesContent).toContain("!('claims' in request.resource.data)");
    });
  });

  // ============================================================================
  // 2. CONTENT SECURITY POLICY & HARDENED HTTP HEADERS
  // ============================================================================
  describe('2. Content Security Policy & HTTP Response Headers', () => {
    it('Emits per-request cryptographic nonce in CSP header', async () => {
      const res = await request(app).get('/health');
      const csp = res.headers['content-security-policy'];

      expect(csp).toBeDefined();
      expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+'/);
    });

    it('Allowlists Razorpay domains across script-src, connect-src, and frame-src in CSP', async () => {
      const res = await request(app).get('/health');
      const csp = res.headers['content-security-policy'];

      expect(csp).toContain('https://checkout.razorpay.com');
      expect(csp).toContain('https://api.razorpay.com');
      expect(csp).toContain('https://lumberjack.razorpay.com');
      expect(csp).toMatch(/frame-src[^;]*https:\/\/checkout\.razorpay\.com/);
    });

    it('Emits Strict-Transport-Security with max-age >= 1 year and includeSubDomains', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains');
    });

    it('Emits X-Content-Type-Options: nosniff and X-Frame-Options: DENY', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
    });
  });

  // ============================================================================
  // 3. CORS STRICT EXACT-ORIGIN ENFORCEMENT
  // ============================================================================
  describe('3. CORS Exact-Origin Enforcement', () => {
    it('Allows legitimate allowed origin', async () => {
      const res = await request(app)
        .options('/api/v1/payments/create-order')
        .set('Origin', 'https://satvik-spot-staging.web.app')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).toBe('https://satvik-spot-staging.web.app');
    });

    it('Rejects suffix lookalike origin', async () => {
      const res = await request(app)
        .options('/api/v1/payments/create-order')
        .set('Origin', 'https://satvik-spot-staging.web.app.evil.com')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('Rejects prefix lookalike origin', async () => {
      const res = await request(app)
        .options('/api/v1/payments/create-order')
        .set('Origin', 'https://evil-satvik-spot-staging.web.app')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('Rejects unauthorized port on allowed origin host', async () => {
      const res = await request(app)
        .options('/api/v1/payments/create-order')
        .set('Origin', 'https://satvik-spot-staging.web.app:8080')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  // ============================================================================
  // 4. PAYMENT GATEWAY SIGNATURE INTEGRITY & WEBHOOK SECURITY
  // ============================================================================
  describe('4. Payment Gateway Signature Integrity & Webhooks', () => {
    const secret = 'test_webhook_secret_key_12345';
    const orderId = 'order_9A33X567';
    const paymentId = 'pay_2938475';

    beforeEach(() => {
      process.env.RAZORPAY_KEY_ID = 'rzp_test_12345';
      process.env.RAZORPAY_KEY_SECRET = secret;
      process.env.RAZORPAY_WEBHOOK_SECRET = secret;
    });

    it('Accepts authentic payment signature matching orderId|paymentId HMAC', () => {
      const payload = `${orderId}|${paymentId}`;
      const validSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const isValid = verifyPaymentSignature({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSig
      });
      expect(isValid).toBe(true);
    });

    it('Rejects tampered payment signature with false', () => {
      const tamperedSig = 'a'.repeat(64);
      const isValid = verifyPaymentSignature({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: tamperedSig
      });
      expect(isValid).toBe(false);
    });

    it('Rejects signature with mismatched length without crashing', () => {
      const shortSig = 'abcd123';
      const isValid = verifyPaymentSignature({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: shortSig
      });
      expect(isValid).toBe(false);
    });

    it('Accepts authentic webhook signature against raw body', () => {
      const rawBody = JSON.stringify({ event: 'payment.captured', payload: {} });
      const validSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      const isValid = verifyWebhookSignature(rawBody, validSig);
      expect(isValid).toBe(true);
    });

    it('Rejects tampered webhook signature against raw body', () => {
      const rawBody = JSON.stringify({ event: 'payment.captured', payload: {} });
      const invalidSig = 'b'.repeat(64);

      const isValid = verifyWebhookSignature(rawBody, invalidSig);
      expect(isValid).toBe(false);
    });
  });

  // ============================================================================
  // 5. PUBLIC ASSET SECRETS & INFRASTRUCTURE SANITIZATION
  // ============================================================================
  describe('5. Public Asset Secrets & Infrastructure Sanitization', () => {
    it('Frontend public files contain zero hardcoded Razorpay private key secrets', () => {
      const scriptJs = fs.readFileSync(path.join(__dirname, '../../public/site/script.js'), 'utf8');
      const productsDataJs = fs.readFileSync(path.join(__dirname, '../../public/site/js/productsData.js'), 'utf8');

      expect(scriptJs).not.toMatch(/rzp_live_[A-Za-z0-9]+/);
      expect(scriptJs).not.toMatch(/rzp_test_[A-Za-z0-9]+/);
      expect(scriptJs).not.toContain('key_secret');
      expect(productsDataJs).not.toContain('key_secret');
    });

    it('Frontend public files contain zero internal cloud infrastructure leaks', () => {
      const indexHtml = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
      const scriptJs = fs.readFileSync(path.join(__dirname, '../../public/site/script.js'), 'utf8');

      expect(indexHtml).not.toContain('onrender.com');
      expect(indexHtml).not.toContain('firebase-admin');
      expect(scriptJs).not.toContain('render.com/deploy');
    });

    it('Frontend public index.html contains no competitor brand names', () => {
      const indexHtml = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
      const competitorKeywords = ['Mothers Recipe', 'Priya Pickle', 'Bedekar', 'Nilons', 'Pachranga'];
      competitorKeywords.forEach(brand => {
        expect(indexHtml).not.toContain(brand);
      });
    });
  });
});
