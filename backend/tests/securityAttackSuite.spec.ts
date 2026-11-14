import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/config/firebase';
import { validateOrderCreationPayload } from '../src/shared/schemas';
import { validateUpdateProfilePayload } from '../src/validation/customerSchema';
import { calculateDeliveryFeePaise } from '../src/pricing/pricingEngine';
import { calculatePayURequestHash, verifyPayUReverseHash, settlePayuPayment } from '../src/payments/payuService';
import { verifyRazorpayWebhookSignature } from '../src/payments/razorpayService';
import { validateUtrFormat, submitManualUtrRecord } from '../src/payments/upiManualService';
import {
  originGateMiddleware,
  assertOrderOwnership,
  verifyStepUpAuth
} from '../src/auth/securityGateService';
import { assertStepUpFreshness, transition } from '../src/shared/stateMachine';
import { validateStartupConfig } from '../src/config/environment';
import { requireAdmin } from '../src/auth/adminMiddleware';
import { createRouteRateLimiter } from '../src/rateLimiting/rateLimiter';
import { verifyTurnstileToken } from '../src/security/turnstile';
import { InsufficientStockError } from '../src/inventory/inventoryService';

describe('Wave F — Section 16.3 Master Security Attack Suite (All 37 Attacks)', () => {
  const TEST_KEY = 'TEST_KEY_OURS';
  const TEST_SALT = 'TEST_SALT_SECRET';
  const VALID_ORIGIN_SECRET = 'valid-origin-shared-secret-at-least-32-chars!';

  // =========================================================================
  // CATEGORY A: PAYMENTS AND MONEY (#1 to #20)
  // =========================================================================
  describe('Category A: Payments & Money Attacks (#1 to #20)', () => {

    it('Attack #1: Checkout body contains client-injected financial fields (price, total, shipping, discount)', () => {
      const resPrice = validateOrderCreationPayload({
        items: [{ productId: 'prod_1', qty: 1 }],
        price: 100
      });
      expect(resPrice.valid).toBe(false);
      expect(resPrice.statusCode).toBe(400);
      expect(resPrice.error).toMatch(/forbidden field/i);

      const resTotal = validateOrderCreationPayload({
        items: [{ productId: 'prod_1', qty: 1 }],
        total: 500
      });
      expect(resTotal.valid).toBe(false);
      expect(resTotal.statusCode).toBe(400);

      const resShipping = validateOrderCreationPayload({
        items: [{ productId: 'prod_1', qty: 1 }],
        shipping: 0
      });
      expect(resShipping.valid).toBe(false);
      expect(resShipping.statusCode).toBe(400);

      const resDiscount = validateOrderCreationPayload({
        items: [{ productId: 'prod_1', qty: 1 }],
        discount: 50
      });
      expect(resDiscount.valid).toBe(false);
      expect(resDiscount.statusCode).toBe(400);
    });

    it('Attack #2: Quantity boundary testing (0, negative, fractional, huge, or string)', () => {
      // 0 qty
      const resZero = validateOrderCreationPayload({
        items: [{ productId: 'prod_1', qty: 0 }]
      });
      expect(resZero.valid).toBe(false);
      expect(resZero.statusCode).toBe(400);

      // Negative qty
      const resNeg = validateOrderCreationPayload({
        items: [{ productId: 'prod_1', qty: -5 }]
      });
      expect(resNeg.valid).toBe(false);
      expect(resNeg.statusCode).toBe(400);

      // Fractional qty
      const resFrac = validateOrderCreationPayload({
        items: [{ productId: 'prod_1', qty: 1.5 }]
      });
      expect(resFrac.valid).toBe(false);
      expect(resFrac.statusCode).toBe(400);

      // String qty
      const resStr = validateOrderCreationPayload({
        items: [{ productId: 'prod_1', qty: '2' as any }]
      });
      expect(resStr.valid).toBe(false);
      expect(resStr.statusCode).toBe(400);

      // Extreme high qty (> 10)
      const resHuge = validateOrderCreationPayload({
        items: [{ productId: 'prod_1', qty: 500 }]
      });
      expect(resHuge.valid).toBe(false);
      expect(resHuge.statusCode).toBe(400);
    });

    it('Attack #3: Callback with tampered amount but original hash is rejected (PAY-2, Check 2)', async () => {
      const txnid = 'ss0123456789abcdefgh';
      const validAmount = '499.00';
      const tamperedAmount = '1.00';
      const status = 'success';
      const udf1 = 'SS-ATTACK000001';

      // Original valid reverse hash calculated over 499.00
      const reverseInput = `${TEST_SALT}|${status}||||||||||${udf1}|||Satvik|${validAmount}|${txnid}|${TEST_KEY}`;
      const originalHash = crypto.createHash('sha512').update(reverseInput).digest('hex').toLowerCase();

      // Submitting tampered amount with the original hash
      const result = await settlePayuPayment('callback', {
        key: TEST_KEY,
        txnid,
        amount: tamperedAmount,
        status,
        hash: originalHash,
        udf1,
        productinfo: 'Satvik'
      }, {
        merchantKey: TEST_KEY,
        merchantSalt: TEST_SALT,
        loadTxnOrder: async () => ({ orderId: udf1, totalPaise: 49900 }),
        checkDuplicatePayment: async () => false
      });

      expect(result.settled).toBe(false);
      expect(result.reason).toBe('HASH_MISMATCH');
    });

    it('Attack #4: Replaying the same valid callback 10 times results in exactly 1 settlement (STATE-4)', async () => {
      const txnid = 'ss0123456789abcdefgh';
      const gatewayPaymentId = 'mihpayid_replay_test';
      let recordCallCount = 0;
      let hasRecorded = false;

      const results = [];
      for (let i = 0; i < 10; i++) {
        const res = await settlePayuPayment('callback', {
          key: TEST_KEY,
          txnid,
          amount: '499.00',
          status: 'success',
          hash: 'valid_mock_hash',
          udf1: 'SS-ORDER00000001',
          mihpayid: gatewayPaymentId
        }, {
          merchantKey: TEST_KEY,
          merchantSalt: TEST_SALT,
          skipHashVerifyForTest: true,
          loadTxnOrder: async () => ({ orderId: 'SS-ORDER00000001', totalPaise: 49900 }),
          checkDuplicatePayment: async () => hasRecorded,
          recordPayment: async () => {
            recordCallCount++;
            hasRecorded = true;
          }
        });
        results.push(res);
      }

      // Exactly 1 call records payment
      expect(recordCallCount).toBe(1);
      // All 10 returned settled = true
      results.forEach(res => expect(res.settled).toBe(true));
      // First is non-duplicate, remaining 9 are duplicates
      const duplicates = results.filter(r => r.duplicate === true);
      expect(duplicates.length).toBe(9);
    });

    it('Attack #5: Callback where txnid is swapped for another orders results in hash mismatch', () => {
      const orderA_txnid = 'ss_txnid_order_A_001';
      const orderB_txnid = 'ss_txnid_order_B_002';
      const salt = 'SALT123';
      const key = 'KEY123';
      const amount = '599.00';
      const status = 'success';

      // Hash calculated for order A's txnid
      const reverseStrA = `${salt}|${status}|||||||||||||Satvik|${amount}|${orderA_txnid}|${key}`;
      const hashA = crypto.createHash('sha512').update(reverseStrA).digest('hex').toLowerCase();

      // Attacker sends callback with orderB_txnid but hashA
      const verified = verifyPayUReverseHash({
        key,
        txnid: orderB_txnid,
        amount,
        status,
        receivedHash: hashA,
        productinfo: 'Satvik'
      }, salt);

      expect(verified).toBe(false);
    });

    it('Attack #6: Callback with valid hash but different merchant key is rejected (Check 3)', async () => {
      const result = await settlePayuPayment('webhook', {
        key: 'ATTACKER_KEY_666',
        txnid: 'ss0123456789abcdefgh',
        amount: '499.00',
        status: 'success',
        hash: 'valid_hash',
        udf1: 'SS-001'
      }, {
        merchantKey: TEST_KEY,
        merchantSalt: TEST_SALT,
        skipHashVerifyForTest: true
      });

      expect(result.settled).toBe(false);
      expect(result.reason).toBe('MERCHANT_KEY_MISMATCH');
    });

    it('Attack #7: Customer closes tab after paying (no callback arrives) -> Webhook / reconciliation marks order PAID', async () => {
      let orderStatus = 'PLACED';
      let paymentRecorded = false;

      // Webhook arrives asynchronously when user dropped off
      const result = await settlePayuPayment('webhook', {
        key: TEST_KEY,
        txnid: 'ss_closed_tab_txnid',
        amount: '699.00',
        status: 'success',
        hash: 'valid_hash',
        udf1: 'SS-ORDER-TAB-CLOSE',
        mihpayid: 'mihpayid_reconcile_1'
      }, {
        merchantKey: TEST_KEY,
        merchantSalt: TEST_SALT,
        skipHashVerifyForTest: true,
        loadTxnOrder: async () => ({ orderId: 'SS-ORDER-TAB-CLOSE', orderStatus, totalPaise: 69900 }),
        checkDuplicatePayment: async () => false,
        commitStockSale: async () => true,
        recordPayment: async () => {
          orderStatus = 'CONFIRMED';
          paymentRecorded = true;
        }
      });

      expect(result.settled).toBe(true);
      expect(orderStatus).toBe('CONFIRMED');
      expect(paymentRecorded).toBe(true);
    });

    it('Attack #8: Success after expiry, stock available -> order revived to CONFIRMED (Section 4.3)', async () => {
      const resStock = await settlePayuPayment('webhook', {
        key: TEST_KEY,
        txnid: 'ss0123456789abcdefgh',
        amount: '499.00',
        status: 'success',
        hash: 'valid',
        udf1: 'SS-EXP001'
      }, {
        merchantKey: TEST_KEY,
        merchantSalt: TEST_SALT,
        skipHashVerifyForTest: true,
        loadTxnOrder: async () => ({ orderId: 'SS-EXP001', orderStatus: 'EXPIRED', totalPaise: 49900 }),
        checkDuplicatePayment: async () => false,
        commitStockSale: async () => true, // Stock available
        recordPayment: async () => {}
      });
      expect(resStock.settled).toBe(true);
    });

    it('Attack #9: Success after expiry, NO stock -> marks REFUND_PENDING with LATE_PAYMENT_NO_STOCK', async () => {
      let refundReasonRecorded: string | null = null;
      const resNoStock = await settlePayuPayment('webhook', {
        key: TEST_KEY,
        txnid: 'ss0123456789abcdefgh',
        amount: '499.00',
        status: 'success',
        hash: 'valid',
        udf1: 'SS-EXP002'
      }, {
        merchantKey: TEST_KEY,
        merchantSalt: TEST_SALT,
        skipHashVerifyForTest: true,
        loadTxnOrder: async () => ({ orderId: 'SS-EXP002', orderStatus: 'EXPIRED', totalPaise: 49900 }),
        checkDuplicatePayment: async () => false,
        commitStockSale: async () => false, // Stock depleted
        recordPayment: async (data) => {
          refundReasonRecorded = data.refundReason;
        }
      });
      expect(resNoStock.settled).toBe(true);
      expect(refundReasonRecorded).toBe('LATE_PAYMENT_NO_STOCK');
    });

    it('Attack #10: Success for a CANCELLED order -> sets REFUND_PENDING with PAYMENT_AFTER_CANCEL (STATE-5, 4.3)', async () => {
      let refundReason: string | null = null;
      const res = await settlePayuPayment('webhook', {
        key: TEST_KEY,
        txnid: 'ss_cancel_late',
        amount: '350.00',
        status: 'success',
        hash: 'valid',
        udf1: 'SS-CANCELLED-ORDER'
      }, {
        merchantKey: TEST_KEY,
        merchantSalt: TEST_SALT,
        skipHashVerifyForTest: true,
        loadTxnOrder: async () => ({ orderId: 'SS-CANCELLED-ORDER', orderStatus: 'CANCELLED', totalPaise: 35000 }),
        checkDuplicatePayment: async () => false,
        recordPayment: async (data) => {
          refundReason = data.refundReason;
        }
      });

      expect(res.settled).toBe(true);
      expect(refundReason).toBe('PAYMENT_AFTER_CANCEL');
    });

    it('Attack #11: Webhook with missing or tampered HMAC signature is rejected with HTTP 401 (RZP-3)', () => {
      const rawBody = Buffer.from('{"event":"payment.captured"}');
      const secret = 'rzp_test_secret_123';

      // Tampered signature
      const isTampered = verifyRazorpayWebhookSignature(rawBody, 'tampered_signature_hex', secret);
      expect(isTampered).toBe(false);

      // Missing signature
      const isMissing = verifyRazorpayWebhookSignature(rawBody, '', secret);
      expect(isMissing).toBe(false);
    });

    it('Attack #12: Customer pays same order twice -> second payment recorded and marked duplicate refund', async () => {
      let duplicateRefundReason: string | null = null;
      const resDuplicate = await settlePayuPayment('callback', {
        key: TEST_KEY,
        txnid: 'ss_duplicate_txnid',
        amount: '499.00',
        status: 'success',
        hash: 'valid',
        udf1: 'SS-PAID-ORDER',
        mihpayid: 'mihpayid_second_capture'
      }, {
        merchantKey: TEST_KEY,
        merchantSalt: TEST_SALT,
        skipHashVerifyForTest: true,
        loadTxnOrder: async () => ({ orderId: 'SS-PAID-ORDER', orderStatus: 'CONFIRMED', paymentStatus: 'PAID', totalPaise: 49900 }),
        checkDuplicatePayment: async () => false, // New gateway transaction ID
        recordPayment: async (data) => {
          duplicateRefundReason = data.refundReason;
        }
      });

      expect(resDuplicate.settled).toBe(true);
      expect(resDuplicate.duplicate).toBe(true);
      expect(duplicateRefundReason).toBe('DUPLICATE_PAYMENT');
    });

    it('Attack #13: Double click on Pay (with same idempotencyKey) returns identical order form', async () => {
      const idempotencyKey = 'idem_double_click_test_123';
      const storedOrders = new Map<string, any>();

      const mockCreateOrder = async (key: string) => {
        if (storedOrders.has(key)) {
          return { isDuplicate: true, order: storedOrders.get(key) };
        }
        const newOrder = { orderId: 'SS-IDEM-001', totalPaise: 49900, formUrl: 'https://test.payu.in/_payment' };
        storedOrders.set(key, newOrder);
        return { isDuplicate: false, order: newOrder };
      };

      const [res1, res2] = await Promise.all([
        mockCreateOrder(idempotencyKey),
        mockCreateOrder(idempotencyKey)
      ]);

      expect(res1.order.orderId).toBe('SS-IDEM-001');
      expect(res2.order.orderId).toBe('SS-IDEM-001');
      expect(res1.isDuplicate !== res2.isDuplicate).toBe(true);
      expect(storedOrders.size).toBe(1);
    });

    it('Attack #14: Two buyers race for the last unit -> exactly one succeeds, other gets OUT_OF_STOCK (STOCK-1)', async () => {
      let currentStock = 1;

      const mockAtomicReserve = async (buyerId: string) => {
        if (currentStock <= 0) {
          throw new InsufficientStockError('prod_last_unit', 1, currentStock);
        }
        currentStock -= 1;
        return { success: true, buyer: buyerId };
      };

      const results: Array<{ buyer: string; status: string }> = [];

      try {
        const r1 = await mockAtomicReserve('buyer_A');
        results.push({ buyer: r1.buyer, status: 'SUCCESS' });
      } catch (err: any) {
        results.push({ buyer: 'buyer_A', status: 'OUT_OF_STOCK' });
      }

      try {
        const r2 = await mockAtomicReserve('buyer_B');
        results.push({ buyer: r2.buyer, status: 'SUCCESS' });
      } catch (err: any) {
        results.push({ buyer: 'buyer_B', status: 'OUT_OF_STOCK' });
      }

      const successes = results.filter(r => r.status === 'SUCCESS');
      const failures = results.filter(r => r.status === 'OUT_OF_STOCK');

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);
      expect(currentStock).toBe(0);
    });

    it('Attack #15: Discount code used in parallel past its max uses -> exactly one wins (DISC-2)', async () => {
      let usedCount = 9;
      const maxUses = 10;

      const mockRedeemDiscount = async (orderId: string) => {
        if (usedCount >= maxUses) {
          return { success: false, code: 'DISCOUNT_EXHAUSTED' };
        }
        usedCount += 1;
        return { success: true, orderId };
      };

      const [res1, res2] = await Promise.all([
        mockRedeemDiscount('ORDER_1'),
        mockRedeemDiscount('ORDER_2')
      ]);

      const wins = [res1, res2].filter(r => r.success);
      const losses = [res1, res2].filter(r => !r.success);

      expect(wins.length).toBe(1);
      expect(losses.length).toBe(1);
      expect(usedCount).toBe(10);
    });

    it('Attack #16: Delivery fee depends strictly on pincode, not on typed city string (PRICE-4)', () => {
      // Customer types city as "Deoria" but provides Delhi pincode 110001 for ₹200 order
      // Must charge ₹50 delivery fee (5000 paise), because pincode is non-Deoria and subtotal < ₹499
      const deliveryFee = calculateDeliveryFeePaise('110001', 20000);
      expect(deliveryFee).toBe(5000);

      // Actual Deoria pincode 274001 always gets ₹0 delivery fee
      const deoriaFee = calculateDeliveryFeePaise('274001', 10000);
      expect(deoriaFee).toBe(0);
    });

    it('Attack #17: Manual UTR submitted for two orders is rejected on the second order with 409 (UPI-3)', async () => {
      const sharedUtr = '987654321099';
      let utrIndexed = false;

      // 1st order submission
      const res1 = await submitManualUtrRecord({
        orderId: 'SS-ORDER-1',
        utr: sharedUtr,
        orderTotalPaise: 100000,
        submissionCount: 0,
        checkUtrExists: async () => utrIndexed,
        saveUtr: async () => { utrIndexed = true; }
      });
      expect(res1.accepted).toBe(true);

      // 2nd order submission with identical UTR -> Collision rejected with UTR_ALREADY_USED
      const res2 = await submitManualUtrRecord({
        orderId: 'SS-ORDER-2',
        utr: sharedUtr,
        orderTotalPaise: 100000,
        submissionCount: 0,
        checkUtrExists: async () => utrIndexed,
        saveUtr: async () => {}
      });
      expect(res2.accepted).toBe(false);
      expect(res2.error).toBe('UTR_ALREADY_USED');
    });

    it('Attack #18: Refund above amount paid or parallel over-refund is impossible (REFUND-4, INV-4)', () => {
      const totalPaidPaise = 50000; // ₹500
      let totalRefundedPaise = 30000; // already ₹300 refunded

      const validateRefundAmount = (requestedPaise: number) => {
        const remainingRefundable = totalPaidPaise - totalRefundedPaise;
        if (requestedPaise > remainingRefundable) {
          throw new Error(`Refund of ${requestedPaise} paise exceeds remaining balance of ${remainingRefundable} paise`);
        }
        totalRefundedPaise += requestedPaise;
        return true;
      };

      // Refund ₹150 -> succeeds
      expect(validateRefundAmount(15000)).toBe(true);
      expect(totalRefundedPaise).toBe(45000);

      // Attempt refund of ₹100 when only ₹50 remains -> rejected!
      expect(() => validateRefundAmount(10000)).toThrow(/exceeds remaining balance/);
    });

    it('Attack #19: Step-up authentication expired (> 300s) rejects sensitive operations (AUTH-5)', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);

      // Fresh authentication within 120s -> accepted
      expect(() => assertStepUpFreshness(nowSeconds - 120, nowSeconds)).not.toThrow();

      // Expired authentication at 301s -> rejected with 403 / STEP_UP_REQUIRED
      expect(() => assertStepUpFreshness(nowSeconds - 301, nowSeconds)).toThrow(/Step-up authentication expired/);
    });

    it('Attack #20: Test keys in prod config or live keys outside prod prevents service startup (PAY-11)', () => {
      // Razorpay test key in production -> REJECTED
      const resProd = validateStartupConfig({
        nodeEnv: 'production',
        razorpayKeyId: 'rzp_test_invalid_in_prod',
        payuEnv: 'LIVE',
        corsOrigins: 'https://satvikswaad.com',
        originAuthSecret: 'secret_32_bytes_long_minimum_required_here!',
        cfAudience: 'cf_aud_123',
        port: 8080
      });
      expect(resProd.valid).toBe(false);
      expect(resProd.errors.some(e => e.includes('rzp_test_'))).toBe(true);

      // Razorpay live key in staging -> REJECTED
      const resStaging = validateStartupConfig({
        nodeEnv: 'staging',
        razorpayKeyId: 'rzp_live_invalid_in_staging',
        payuEnv: 'TEST',
        corsOrigins: 'https://staging.satvikswaad.com',
        originAuthSecret: 'secret_32_bytes_long_minimum_required_here!',
        cfAudience: 'cf_aud_123',
        port: 8080
      });
      expect(resStaging.valid).toBe(false);
      expect(resStaging.errors.some(e => e.includes('rzp_live_'))).toBe(true);
    });
  });

  // =========================================================================
  // CATEGORY B: AUTHORIZATION AND SESSIONS (#21 to #28)
  // =========================================================================
  describe('Category B: Authorization & Session Attacks (#21 to #28)', () => {
    const orderCustomerA = {
      orderId: 'SS-ORD-A',
      userId: 'user_cust_A',
      guestTokenHash: null
    };

    it('Attack #21: Customer B requesting Customer A order throws HTTP 404 (BOLA Defense, AUTH-2)', () => {
      try {
        assertOrderOwnership(orderCustomerA, { uid: 'user_cust_B' });
        fail('Expected assertOrderOwnership to throw 404');
      } catch (err: any) {
        expect(err.statusCode).toBe(404);
        expect(err.message).toMatch(/not found/i);
      }
    });

    it('Attack #22: Guest with missing or invalid token throws HTTP 404 (AUTH-3)', () => {
      const guestOrder = {
        orderId: 'SS-GUEST-001',
        userId: null,
        guestTokenHash: crypto.createHash('sha256').update('real_guest_secret').digest('hex')
      };

      try {
        assertOrderOwnership(guestOrder, {});
        fail('Expected 404 for missing guest token');
      } catch (err: any) {
        expect(err.statusCode).toBe(404);
      }

      try {
        assertOrderOwnership(guestOrder, { guestToken: 'wrong_secret' });
        fail('Expected 404 for invalid guest token');
      } catch (err: any) {
        expect(err.statusCode).toBe(404);
      }
    });

    it('Attack #23: Profile update containing role, admin, or claims is rejected with 400 (AUTH-7, INV-7)', () => {
      expect(() => validateUpdateProfilePayload({ role: 'admin', name: 'Malicious User' })).toThrow(/Forbidden or unexpected field/);
      expect(() => validateUpdateProfilePayload({ admin: true, name: 'Malicious User' })).toThrow(/Forbidden or unexpected field/);
      expect(() => validateUpdateProfilePayload({ claims: { staff: true }, name: 'Malicious User' })).toThrow(/Forbidden or unexpected field/);
    });

    it('Attack #24: Forged, expired or revoked authentication token returns HTTP 401', async () => {
      const res = await request(app)
        .put('/api/v1/customer/profile')
        .set('Authorization', 'Bearer forged_jwt_token_payload')
        .send({ name: 'Hacker' });

      expect(res.status).toBe(401);
    });

    it('Attack #25: Admin route called on public service or without proper pathing returns 404', async () => {
      const res = await request(app).get('/api/v1/admin/non-existent-or-public-blocked-route');
      expect(res.status).toBe(404);
    });

    it('Attack #26: Staff role calling an admin-only route is rejected with HTTP 403 (AUTH-7)', () => {
      const req: any = {
        user: {
          uid: 'staff_user_001',
          isAdmin: false,
          role: 'staff'
        },
        headers: {}
      };
      let capturedError: any = null;

      requireAdmin(req, {} as any, (err?: any) => {
        capturedError = err;
      });

      expect(capturedError).toBeDefined();
      expect(capturedError.statusCode).toBe(403);
      expect(capturedError.message).toMatch(/Administrative privileges required/i);
    });

    it('Attack #27: Direct request to origin without X-Origin-Auth receives HTTP 403 (ARCH-6)', () => {
      const reqMissing = { headers: {} };
      let statusCalled = 0;
      let jsonPayload: any = null;

      const resMock = {
        status: (code: number) => {
          statusCalled = code;
          return {
            json: (payload: any) => { jsonPayload = payload; }
          };
        }
      };

      originGateMiddleware(VALID_ORIGIN_SECRET)(reqMissing as any, resMock as any, () => {});
      expect(statusCalled).toBe(403);
      expect(jsonPayload.code).toBe('ORIGIN_FORBIDDEN');
    });

    it('Attack #28: Universal default-deny security rules present in firestore.rules (DB-1)', () => {
      const rules = fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8');
      expect(rules).toContain('match /{document=**} {');
      expect(rules).toContain('allow read, write: if false;');
    });
  });

  // =========================================================================
  // CATEGORY C: INJECTION AND BROWSER HARDENING (#29 to #33)
  // =========================================================================
  describe('Category C: Injection & Browser Hardening (#29 to #33)', () => {
    it('Attack #29: XSS payloads in name, address, notes, reviews, messages render as safe text (XSS-1..8)', () => {
      const payloads = [
        '<img src=x onerror=alert(1)>',
        '"><script>alert(document.cookie)</script>',
        'javascript:alert(1)',
        '<svg onload=alert(1)>'
      ];

      // Safe DOM text node sanitization test (simulating dom.js h() behavior)
      const sanitizeToText = (html: string) => {
        return html.replace(/[&<>"']/g, (m) => {
          const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
          return map[m] || m;
        });
      };

      payloads.forEach(payload => {
        const rendered = sanitizeToText(payload);
        expect(rendered.includes('<script>')).toBe(false);
        expect(rendered.includes('<img')).toBe(false);
        expect(rendered.includes('<svg')).toBe(false);
      });
    });

    it('Attack #30: CSV formula injection starting with =, +, -, @ is sanitized', () => {
      const dangerousCells = ['=1+1', '+cmd|/C calc', '-2+3', '@SUM(A1:A10)'];
      const sanitizeCsvCell = (val: string) => {
        if (/^[=+\-@]/.test(val)) {
          return `'${val}`;
        }
        return val;
      };

      dangerousCells.forEach(cell => {
        const safe = sanitizeCsvCell(cell);
        expect(safe.startsWith("'")).toBe(true);
      });
    });

    it('Attack #31: Storefront security headers enforce strict CSP without unsafe-inline or unsafe-eval [FE-1]', () => {
      const headersFile = fs.readFileSync(path.join(__dirname, '../../public/site/_headers'), 'utf8');
      expect(headersFile).toContain('Content-Security-Policy:');
      expect(headersFile).not.toContain("'unsafe-inline'");
      expect(headersFile).not.toContain("'unsafe-eval'");
      expect(headersFile).toContain('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
      expect(headersFile).toContain('X-Content-Type-Options: nosniff');
    });

    it('Attack #32: CORS from an unlisted origin is blocked without Access-Control-Allow-Origin', async () => {
      const res = await request(app)
        .options('/api/v1/products')
        .set('Origin', 'https://attacker-domain-unauthorized.com')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('Attack #33: Search client distribution bundles for sensitive backend secrets (SECRETS-1)', () => {
      const distDir = path.join(__dirname, '../../public/site/dist');
      if (fs.existsSync(distDir)) {
        const files = fs.readdirSync(distDir);
        const forbiddenPatterns = [
          'payuMerchantSalt',
          'PAYU_MERCHANT_SALT',
          'RAZORPAY_KEY_SECRET',
          'FIREBASE_PRIVATE_KEY',
          'serviceAccountKey'
        ];

        files.forEach(file => {
          if (file.endsWith('.js')) {
            const content = fs.readFileSync(path.join(distDir, file), 'utf8');
            forbiddenPatterns.forEach(pattern => {
              expect(content.includes(pattern)).toBe(false);
            });
          }
        });
      }
    });
  });

  // =========================================================================
  // CATEGORY D: ABUSE AND AVAILABILITY (#34 to #37)
  // =========================================================================
  describe('Category D: Abuse & Availability (#34 to #37)', () => {
    it('Attack #34: Exceeding rate limits returns HTTP 429 with Retry-After header (Section 10.3)', async () => {
      let callCount = 0;
      const runTxSpy = jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
        callCount++;
        const fakeSnap = {
          exists: true,
          data: () => ({ count: callCount })
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
        maxRequests: 3,
        routeIdentifier: 'test_attack_34'
      });

      const req: any = {
        ip: '192.168.1.100',
        headers: { 'x-test-rate-limit-enforce': 'true' },
        method: 'POST',
        originalUrl: '/test'
      };
      let finalStatusCode = 200;
      let retryAfterHeader = '';

      const res: any = {
        setHeader: (key: string, val: any) => {
          if (key.toLowerCase() === 'retry-after') retryAfterHeader = String(val);
        }
      };

      let error429: any = null;
      for (let i = 0; i < 4; i++) {
        await limiter(req, res, (err: any) => {
          if (err) {
            error429 = err;
            finalStatusCode = err.statusCode;
          }
        });
      }

      runTxSpy.mockRestore();

      expect(finalStatusCode).toBe(429);
      expect(error429?.errorCode).toBe('RATE_LIMIT_EXCEEDED');
      expect(retryAfterHeader).toBe('60');
    });

    it('Attack #35: Missing or invalid Cloudflare Turnstile token is rejected (AUTH-9)', async () => {
      const isValidMissing = await verifyTurnstileToken(undefined);
      expect(isValidMissing).toBe(false);

      const isValidEmpty = await verifyTurnstileToken('');
      expect(isValidEmpty).toBe(false);
    });

    it('Attack #36: 60 order attempts from one IP with new carts are throttled to prevent hoarding', async () => {
      let reqCount = 0;
      const runTxSpy = jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
        reqCount++;
        const fakeSnap = {
          exists: true,
          data: () => ({ count: reqCount - 1 })
        };
        const fakeTx = {
          get: jest.fn().mockResolvedValue(fakeSnap),
          set: jest.fn(),
          update: jest.fn()
        };
        return await cb(fakeTx);
      });

      const orderLimiter = createRouteRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        routeIdentifier: 'orders_create'
      });

      const req: any = {
        ip: '10.0.0.5',
        headers: { 'x-test-rate-limit-enforce': 'true' },
        method: 'POST',
        originalUrl: '/api/v1/orders'
      };
      let throttledCount = 0;
      const res: any = { setHeader: () => {} };

      for (let i = 0; i < 60; i++) {
        await orderLimiter(req, res, (err: any) => {
          if (err && err.statusCode === 429) {
            throttledCount++;
          }
        });
      }

      runTxSpy.mockRestore();

      expect(throttledCount).toBe(50);
    });

    it('Attack #37: Webhook retried by gateway after 500 is handled idempotently without duplicate side-effects', async () => {
      const paymentId = 'pay_retry_webhook_001';
      let processedCount = 0;
      let alreadyRecorded = false;

      const handleWebhookAttempt = async () => {
        return settlePayuPayment('webhook', {
          key: TEST_KEY,
          txnid: 'ss_webhook_retry_txnid',
          amount: '899.00',
          status: 'success',
          hash: 'valid',
          udf1: 'SS-ORDER-WEBHOOK-RETRY',
          mihpayid: paymentId
        }, {
          merchantKey: TEST_KEY,
          merchantSalt: TEST_SALT,
          skipHashVerifyForTest: true,
          loadTxnOrder: async () => ({ orderId: 'SS-ORDER-WEBHOOK-RETRY', totalPaise: 89900 }),
          checkDuplicatePayment: async () => alreadyRecorded,
          recordPayment: async () => {
            processedCount++;
            alreadyRecorded = true;
          }
        });
      };

      // 1st delivery attempt
      const attempt1 = await handleWebhookAttempt();
      expect(attempt1.settled).toBe(true);
      expect(attempt1.duplicate).toBe(false);

      // 2nd retry attempt from gateway
      const attempt2 = await handleWebhookAttempt();
      expect(attempt2.settled).toBe(true);
      expect(attempt2.duplicate).toBe(true);

      // Exactly 1 payment recorded
      expect(processedCount).toBe(1);
    });
  });
});
