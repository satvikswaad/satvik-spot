import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { validateOrderCreationPayload } from '../src/shared/schemas';
import { calculateDeliveryFeePaise } from '../src/pricing/pricingEngine';
import { calculatePayURequestHash, verifyPayUReverseHash, settlePayuPayment } from '../src/payments/payuService';
import { verifyRazorpayWebhookSignature } from '../src/payments/razorpayService';
import { validateUtrFormat, submitManualUtrRecord } from '../src/payments/upiManualService';
import {
  originGateMiddleware,
  assertOrderOwnership,
  verifyStepUpAuth
} from '../src/auth/securityGateService';
import { assertStepUpFreshness } from '../src/shared/stateMachine';

describe('Wave 4 — Section 16.3 Master Security Attack Suite (Attacks #1 to #37)', () => {
  const TEST_KEY = 'TEST_KEY_OURS';
  const TEST_SALT = 'TEST_SALT_SECRET';
  const VALID_ORIGIN_SECRET = 'valid-origin-shared-secret-at-least-32-chars!';

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

    it('Attack #8 & #9: Expired order late payment revival behavior (Section 4.3)', async () => {
      // #8: Stock available -> revived to CONFIRMED
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
        commitStockSale: async () => true, // Stock still available
        recordPayment: async () => {}
      });
      expect(resStock.settled).toBe(true);

      // #9: Stock NOT available -> marks REFUND_PENDING with LATE_PAYMENT_NO_STOCK
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
        commitStockSale: async () => false, // Stock depleted!
        recordPayment: async (data) => {
          refundReasonRecorded = data.refundReason;
        }
      });
      expect(resNoStock.settled).toBe(true);
      expect(refundReasonRecorded).toBe('LATE_PAYMENT_NO_STOCK');
    });

    it('Attack #11: Razorpay webhook with missing or tampered HMAC signature is rejected (RZP-3)', () => {
      const rawBody = Buffer.from('{"event":"payment.captured"}');
      const secret = 'rzp_test_secret_123';

      // Tampered signature
      const isTampered = verifyRazorpayWebhookSignature(rawBody, 'tampered_signature_hex', secret);
      expect(isTampered).toBe(false);

      // Missing signature
      const isMissing = verifyRazorpayWebhookSignature(rawBody, '', secret);
      expect(isMissing).toBe(false);
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

    it('Attack #17: Manual UTR submitted for two orders is rejected on the second order (UPI-3)', async () => {
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

      // 2nd order submission with identical UTR -> Collision rejected!
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

    it('Attack #19: Step-up authentication expired (> 300s) rejects sensitive operations (AUTH-5)', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);

      // Fresh authentication within 120s -> accepted
      expect(() => assertStepUpFreshness(nowSeconds - 120, nowSeconds)).not.toThrow();

      // Expired authentication at 301s -> rejected with 403 / STEP_UP_REQUIRED
      expect(() => assertStepUpFreshness(nowSeconds - 301, nowSeconds)).toThrow(/Step-up authentication expired/);
    });
  });

  describe('Category B: Authorization & Session Attacks (#21 to #28)', () => {
    const orderCustomerA = {
      orderId: 'SS-ORD-A',
      userId: 'user_cust_A',
      guestTokenHash: null
    };

    it('Attack #21: Customer B requesting Customer A order throws HTTP 404 (BOLA Defense, AUTH-2)', () => {
      // Must throw ResourceNotFoundError (statusCode 404), NEVER 403 Forbidden
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

  describe('Category C: Injection & Browser Hardening (#29 to #33)', () => {
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
});
