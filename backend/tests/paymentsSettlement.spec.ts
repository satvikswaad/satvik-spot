import * as crypto from 'crypto';
import {
  calculatePayURequestHash,
  verifyPayUReverseHash,
  settlePayuPayment,
  PayUSettleInput
} from '../src/payments/payuService';
import {
  createRazorpayOrderPayload,
  verifyRazorpayWebhookSignature,
  settleRazorpayPayment
} from '../src/payments/razorpayService';
import {
  validateUtrFormat,
  submitManualUtrRecord,
  verifyManualUtrPayment
} from '../src/payments/upiManualService';

describe('Wave 3 — Payments Role: PayU, Razorpay, Manual UPI & Settlement (PAY-1..11, RZP-1..5, UPI-1..8)', () => {
  const TEST_KEY = 'TEST_KEY_123';
  const TEST_SALT = 'TEST_SALT_456';

  describe('1. PayU Request & Response Hash Computation (PAY-1, PAY-2, PAY-3)', () => {
    it('PAY-1: Computes exact SHA-512 request hash matching PayU formula', () => {
      // Formula: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
      const params = {
        key: TEST_KEY,
        txnid: 'ss0123456789abcdefgh',
        amount: '499.00',
        productinfo: 'Satvik Artisanal Pickles',
        firstname: 'Ramesh',
        email: 'ramesh@example.com',
        udf1: 'SS-012345678901',
        udf2: '9876543210',
        salt: TEST_SALT
      };

      const hash = calculatePayURequestHash(params);
      const expectedInput = `${TEST_KEY}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|${params.udf1}|${params.udf2}|||||||||${TEST_SALT}`;
      const expectedHash = crypto.createHash('sha512').update(expectedInput).digest('hex').toLowerCase();

      expect(hash).toBe(expectedHash);
    });

    it('PAY-2: Verifies reverse response hash using constant-time comparison', () => {
      // Formula: SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
      const txnid = 'ss0123456789abcdefgh';
      const amount = '499.00';
      const status = 'success';
      const udf1 = 'SS-012345678901';
      const udf2 = '9876543210';
      const email = 'ramesh@example.com';
      const firstname = 'Ramesh';
      const productinfo = 'Satvik Artisanal Pickles';

      const reverseInput = `${TEST_SALT}|${status}|||||||||${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${TEST_KEY}`;
      const validHash = crypto.createHash('sha512').update(reverseInput).digest('hex').toLowerCase();

      const isValid = verifyPayUReverseHash({
        salt: TEST_SALT,
        status,
        udf1,
        udf2,
        email,
        firstname,
        productinfo,
        amount,
        txnid,
        key: TEST_KEY,
        receivedHash: validHash
      });

      expect(isValid).toBe(true);

      // Tampered hash must be rejected
      const tamperedHash = validHash.slice(0, -4) + '0000';
      const isTamperedValid = verifyPayUReverseHash({
        salt: TEST_SALT,
        status,
        udf1,
        udf2,
        email,
        firstname,
        productinfo,
        amount,
        txnid,
        key: TEST_KEY,
        receivedHash: tamperedHash
      });

      expect(isTamperedValid).toBe(false);
    });
  });

  describe('2. Single Canonical Settlement Path: settlePayuPayment (PAY-5, Appendix A3)', () => {
    const mockOrder = {
      orderId: 'SS-TEST00010001',
      totalPaise: 49900,
      orderStatus: 'PLACED',
      paymentStatus: 'UNPAID',
      items: [{ productId: 'mango-achar', qty: 1 }]
    };

    it('PAY-5: Stops at Check 2 if response hash does not match (HASH_MISMATCH)', async () => {
      const payload: PayUSettleInput = {
        key: TEST_KEY,
        txnid: 'ss0123456789abcdefgh',
        amount: '499.00',
        status: 'success',
        hash: 'invalid_sha512_hash',
        udf1: 'SS-TEST00010001',
        mihpayid: 'payu_mih_12345'
      };

      const result = await settlePayuPayment('webhook', payload, {
        merchantKey: TEST_KEY,
        merchantSalt: TEST_SALT,
        loadTxnOrder: async () => mockOrder,
        checkDuplicatePayment: async () => false,
        recordPayment: async () => {}
      });

      expect(result.settled).toBe(false);
      expect(result.reason).toBe('HASH_MISMATCH');
    });

    it('PAY-5: Stops at Check 3 if merchant key is not ours', async () => {
      const payload: PayUSettleInput = {
        key: 'WRONG_KEY',
        txnid: 'ss0123456789abcdefgh',
        amount: '499.00',
        status: 'success',
        hash: 'valid',
        udf1: 'SS-TEST00010001',
        mihpayid: 'payu_mih_12345'
      };

      const result = await settlePayuPayment('webhook', payload, {
        merchantKey: TEST_KEY,
        merchantSalt: TEST_SALT,
        skipHashVerifyForTest: true,
        loadTxnOrder: async () => mockOrder,
        checkDuplicatePayment: async () => false,
        recordPayment: async () => {}
      });

      expect(result.settled).toBe(false);
      expect(result.reason).toBe('MERCHANT_KEY_MISMATCH');
    });

    it('PAY-5: Stops at Check 5 if amount does not match stored totalPaise (AMOUNT_MISMATCH)', async () => {
      const payload: PayUSettleInput = {
        key: TEST_KEY,
        txnid: 'ss0123456789abcdefgh',
        amount: '299.00', // order is 499.00
        status: 'success',
        hash: 'valid',
        udf1: 'SS-TEST00010001',
        mihpayid: 'payu_mih_12345'
      };

      const result = await settlePayuPayment('webhook', payload, {
        merchantKey: TEST_KEY,
        merchantSalt: TEST_SALT,
        skipHashVerifyForTest: true,
        loadTxnOrder: async () => mockOrder,
        checkDuplicatePayment: async () => false,
        recordPayment: async () => {}
      });

      expect(result.settled).toBe(false);
      expect(result.reason).toBe('AMOUNT_MISMATCH');
    });

    it('STATE-4: Treats previously recorded gateway payment ID as idempotent duplicate (no-op)', async () => {
      const payload: PayUSettleInput = {
        key: TEST_KEY,
        txnid: 'ss0123456789abcdefgh',
        amount: '499.00',
        status: 'success',
        hash: 'valid',
        udf1: 'SS-TEST00010001',
        mihpayid: 'payu_mih_already_seen'
      };

      let recordCalled = false;
      const result = await settlePayuPayment('webhook', payload, {
        merchantKey: TEST_KEY,
        merchantSalt: TEST_SALT,
        skipHashVerifyForTest: true,
        loadTxnOrder: async () => mockOrder,
        checkDuplicatePayment: async () => true, // already seen
        recordPayment: async () => { recordCalled = true; }
      });

      expect(result.settled).toBe(true);
      expect(result.duplicate).toBe(true);
      expect(recordCalled).toBe(false);
    });

    it('PAY-5: Successfully transitions order to PAID and records transaction when all 5 checks pass', async () => {
      const payload: PayUSettleInput = {
        key: TEST_KEY,
        txnid: 'ss0123456789abcdefgh',
        amount: '499.00',
        status: 'success',
        hash: 'valid',
        udf1: 'SS-TEST00010001',
        mihpayid: 'payu_mih_new_123'
      };

      let recordedData: any = null;
      const result = await settlePayuPayment('webhook', payload, {
        merchantKey: TEST_KEY,
        merchantSalt: TEST_SALT,
        skipHashVerifyForTest: true,
        loadTxnOrder: async () => mockOrder,
        checkDuplicatePayment: async () => false,
        recordPayment: async (data) => { recordedData = data; }
      });

      expect(result.settled).toBe(true);
      expect(result.duplicate).toBe(false);
      expect(recordedData).not.toBeNull();
      expect(recordedData.paymentStatus).toBe('PAID');
      expect(recordedData.orderStatus).toBe('CONFIRMED');
    });

    it('Section 4.3: Late-payment revival sets REFUND_PENDING when stock reservation cannot be committed', async () => {
      const expiredOrder = {
        ...mockOrder,
        orderStatus: 'EXPIRED',
        paymentStatus: 'UNPAID'
      };

      const payload: PayUSettleInput = {
        key: TEST_KEY,
        txnid: 'ss0123456789abcdefgh',
        amount: '499.00',
        status: 'success',
        hash: 'valid',
        udf1: 'SS-TEST00010001',
        mihpayid: 'payu_mih_late_999'
      };

      let recordedData: any = null;
      const result = await settlePayuPayment('webhook', payload, {
        merchantKey: TEST_KEY,
        merchantSalt: TEST_SALT,
        skipHashVerifyForTest: true,
        loadTxnOrder: async () => expiredOrder,
        checkDuplicatePayment: async () => false,
        commitStockSale: async () => false, // Stock gone!
        recordPayment: async (data) => { recordedData = data; }
      });

      expect(result.settled).toBe(true);
      expect(recordedData.paymentStatus).toBe('REFUND_PENDING');
      expect(recordedData.refundReason).toBe('LATE_PAYMENT_NO_STOCK');
    });

    it('STATE-5, 4.3: CANCELLED order cannot be revived on payment - sets REFUND_PENDING with PAYMENT_AFTER_CANCEL', async () => {
      const cancelledOrder = {
        orderId: 'SS-TEST-CANCELLED',
        totalPaise: 49900,
        orderStatus: 'CANCELLED'
      };

      const payload: PayUSettleInput = {
        key: TEST_KEY,
        txnid: 'ss0123456789abcdefgh',
        amount: '499.00',
        status: 'success',
        hash: 'valid',
        udf1: 'SS-TEST-CANCELLED',
        mihpayid: 'payu_mih_cancel_123'
      };

      let recordedData: any = null;
      const result = await settlePayuPayment('webhook', payload, {
        merchantKey: TEST_KEY,
        merchantSalt: TEST_SALT,
        skipHashVerifyForTest: true,
        loadTxnOrder: async () => cancelledOrder,
        checkDuplicatePayment: async () => false,
        recordPayment: async (data) => { recordedData = data; }
      });

      expect(result.settled).toBe(true);
      expect(recordedData.paymentStatus).toBe('REFUND_PENDING');
      expect(recordedData.refundReason).toBe('PAYMENT_AFTER_CANCEL');
      expect(recordedData.orderStatus).toBeUndefined();
    });
  });

  describe('3. Razorpay Orders & Webhook Verification (RZP-1 to RZP-5)', () => {
    it('RZP-1: Creates order payload with integer paise amount and order receipt', () => {
      const payload = createRazorpayOrderPayload({
        orderId: 'SS-012345678901',
        totalPaise: 54900
      });

      expect(payload.amount).toBe(54900);
      expect(typeof payload.amount).toBe('number');
      expect(Number.isInteger(payload.amount)).toBe(true);
      expect(payload.currency).toBe('INR');
      expect(payload.receipt).toBe('SS-012345678901');
    });

    it('RZP-3: Verifies X-Razorpay-Signature HMAC-SHA256 over raw body buffer', () => {
      const webhookSecret = 'rzp_sec_abcdef';
      const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_123' } } } }));
      const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

      const isValid = verifyRazorpayWebhookSignature(rawBody, expectedSignature, webhookSecret);
      expect(isValid).toBe(true);

      const isInvalid = verifyRazorpayWebhookSignature(rawBody, 'tampered_sig', webhookSecret);
      expect(isInvalid).toBe(false);
    });
  });

  describe('4. Manual UPI with Customer-Typed UTR (UPI-1 to UPI-6)', () => {
    it('UPI-3: Validates 12-digit numeric UTR strictly', () => {
      expect(validateUtrFormat('123456789012')).toBe(true);
      expect(validateUtrFormat('12345678901')).toBe(false); // 11 digits
      expect(validateUtrFormat('1234567890123')).toBe(false); // 13 digits
      expect(validateUtrFormat('12345678901A')).toBe(false); // alphabetic
      expect(validateUtrFormat('')).toBe(false);
    });

    it('UPI-2: Rejects order value above ₹2,000 (200,000 paise)', async () => {
      const result = await submitManualUtrRecord({
        orderId: 'SS-UPI00000001',
        utr: '123456789012',
        orderTotalPaise: 200100, // ₹2,001
        submissionCount: 1,
        checkUtrExists: async () => false,
        saveUtr: async () => {}
      });

      expect(result.accepted).toBe(false);
      expect(result.error).toBe('EXCEEDS_UPI_MANUAL_LIMIT');
    });

    it('UPI-3: Rejects duplicate UTR via utrIndex collision check', async () => {
      const result = await submitManualUtrRecord({
        orderId: 'SS-UPI00000001',
        utr: '123456789012',
        orderTotalPaise: 150000,
        submissionCount: 1,
        checkUtrExists: async () => true, // already claimed!
        saveUtr: async () => {}
      });

      expect(result.accepted).toBe(false);
      expect(result.error).toBe('UTR_ALREADY_USED');
    });

    it('UPI-4: Rejects submission if customer already submitted 3 times for order', async () => {
      const result = await submitManualUtrRecord({
        orderId: 'SS-UPI00000001',
        utr: '123456789012',
        orderTotalPaise: 150000,
        submissionCount: 3, // already 3 attempts!
        checkUtrExists: async () => false,
        saveUtr: async () => {}
      });

      expect(result.accepted).toBe(false);
      expect(result.error).toBe('MAX_UTR_ATTEMPTS_EXCEEDED');
    });
  });
});
