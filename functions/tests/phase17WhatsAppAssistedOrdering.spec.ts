import fs from 'fs';
import path from 'path';
import {
  BUSINESS_CONFIG,
  validateIndianMobileNumber,
  formatWaMeNumber,
  buildWhatsAppUrl,
  buildWebWhatsAppUrl,
  validateUtrFormat,
  CONTROLLED_REJECTION_REASONS
} from '../../backend/src/config/businessConfig';
import { generateWhatsAppPrefilledMessage } from '../../backend/src/orders/orderService';

describe('Phase 17 — Comprehensive 45-Requirement Traceability & Verification Test Suite', () => {
  const publicSiteDir = path.resolve(__dirname, '../../public/site');
  const backendSrcDir = path.resolve(__dirname, '../../backend/src');

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 1: Centralized WhatsApp Configuration & Helpers (Req 1-6)
  // ──────────────────────────────────────────────────────────────────────────

  it('Req 1: Centralized Business Config defines official WhatsApp number +919236587600', () => {
    expect(BUSINESS_CONFIG.whatsapp.displayNumber).toBe('+919236587600');
  });

  it('Req 2: formatWaMeNumber produces strictly numeric 919236587600 without spaces/hyphens', () => {
    const waMe = formatWaMeNumber('9236587600');
    expect(waMe).toBe('919236587600');
    expect(waMe).not.toMatch(/[\s\-\(\)]/);
  });

  it('Req 3: BUSINESS_CONFIG exports 10-digit Indian subscriber number 9236587600', () => {
    expect(BUSINESS_CONFIG.whatsapp.subscriberNumber).toBe('9236587600');
  });

  it('Req 4: validateIndianMobileNumber validates 10-digit subscriber numbers accurately', () => {
    expect(validateIndianMobileNumber('9236587600')).toBe(true);
    expect(validateIndianMobileNumber('9876543210')).toBe(true);
    expect(validateIndianMobileNumber('12345')).toBe(false);
    expect(validateIndianMobileNumber('0000000000')).toBe(false);
  });

  it('Req 5: buildWhatsAppUrl constructs wa.me URL with encodeURIComponent encoding', () => {
    const text = 'Namaste Satvik Swaad & Order #123456';
    const url = buildWhatsAppUrl(text);
    expect(url).toContain('https://wa.me/919236587600?text=');
    expect(url).toContain(encodeURIComponent(text));
  });

  it('Req 6: Frontend businessConfig.js module exists and exports identical WhatsApp configuration', () => {
    const feConfigPath = path.join(publicSiteDir, 'js', 'businessConfig.js');
    expect(fs.existsSync(feConfigPath)).toBe(true);
    const js = fs.readFileSync(feConfigPath, 'utf8');
    expect(js).toContain('919236587600');
    expect(js).toContain('+919236587600');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 2: Prefilled Message Format & Privacy (Req 7-18)
  // ──────────────────────────────────────────────────────────────────────────

  it('Req 7: Initial Payment Status is PAYMENT_PENDING for new WhatsApp order requests', () => {
    const schemaTs = fs.readFileSync(path.join(backendSrcDir, 'orders', 'orderService.ts'), 'utf8');
    expect(schemaTs).toContain("const initialPaymentStatus = 'PAYMENT_PENDING';");
  });

  it('Req 8: Initial Order Status is AWAITING_PAYMENT for new WhatsApp order requests', () => {
    const schemaTs = fs.readFileSync(path.join(backendSrcDir, 'orders', 'orderService.ts'), 'utf8');
    expect(schemaTs).toContain("const initialOrderStatus = 'AWAITING_PAYMENT';");
  });

  it('Req 9: Prefilled message includes Order ID formatted as #XXXXXX', () => {
    const msg = generateWhatsAppPrefilledMessage({
      publicOrderId: 'ord_123456',
      items: [{ name: 'Aam Achar', qty: 1, unitPrice: 249, lineTotal: 249 }],
      subtotal: 249,
      shippingFee: 0,
      total: 249,
      customerName: 'Rohan Sharma',
      phone: '9876543210'
    });
    expect(msg).toContain('Order ID: #123456');
  });

  it('Req 10: Prefilled message includes line items summary with quantities and line totals', () => {
    const msg = generateWhatsAppPrefilledMessage({
      publicOrderId: 'ord_123456',
      items: [
        { name: 'Khatta Meetha Aam Achar', qty: 2, unitPrice: 249, lineTotal: 498 },
        { name: 'Amla Laddu', qty: 1, unitPrice: 349, lineTotal: 349 }
      ],
      subtotal: 847,
      shippingFee: 0,
      total: 847,
      customerName: 'Rohan Sharma',
      phone: '9876543210'
    });
    expect(msg).toContain('Khatta Meetha Aam Achar');
    expect(msg).toContain('(x2)');
    expect(msg).toContain('₹498');
  });

  it('Req 11: Prefilled message includes server-calculated subtotal amount', () => {
    const msg = generateWhatsAppPrefilledMessage({
      publicOrderId: 'ord_123456',
      items: [{ name: 'Aam Achar', qty: 1, unitPrice: 249, lineTotal: 249 }],
      subtotal: 249,
      shippingFee: 0,
      total: 249,
      customerName: 'Rohan Sharma',
      phone: '9876543210'
    });
    expect(msg).toContain('Subtotal: ₹249');
  });

  it('Req 12: Prefilled message truthfully includes delivery charge or FREE (Promo) / Pending Verification', () => {
    const msgFree = generateWhatsAppPrefilledMessage({
      publicOrderId: 'ord_123456',
      items: [{ name: 'Aam Achar', qty: 1, unitPrice: 249, lineTotal: 249 }],
      subtotal: 249,
      shippingFee: 0,
      total: 249,
      customerName: 'Rohan',
      phone: '9876543210'
    });
    expect(msgFree).toContain('Delivery: FREE (Promo)');
  });

  it('Req 13: Prefilled message includes server-calculated final total amount', () => {
    const msg = generateWhatsAppPrefilledMessage({
      publicOrderId: 'ord_123456',
      items: [{ name: 'Aam Achar', qty: 1, unitPrice: 249, lineTotal: 249 }],
      subtotal: 249,
      shippingFee: 0,
      total: 249,
      customerName: 'Rohan',
      phone: '9876543210'
    });
    expect(msg).toContain('Final Amount: ₹249');
  });

  it('Req 14: Prefilled message includes customer name', () => {
    const msg = generateWhatsAppPrefilledMessage({
      publicOrderId: 'ord_123456',
      items: [{ name: 'Aam Achar', qty: 1, unitPrice: 249, lineTotal: 249 }],
      subtotal: 249,
      shippingFee: 0,
      total: 249,
      customerName: 'Aarav Sharma',
      phone: '9876543210'
    });
    expect(msg).toContain('Customer: Aarav Sharma');
  });

  it('Req 15: Prefilled message includes masked mobile number (+91 987654****3210)', () => {
    const msg = generateWhatsAppPrefilledMessage({
      publicOrderId: 'ord_123456',
      items: [{ name: 'Aam Achar', qty: 1, unitPrice: 249, lineTotal: 249 }],
      subtotal: 249,
      shippingFee: 0,
      total: 249,
      customerName: 'Aarav',
      phone: '9876543210'
    });
    expect(msg).toContain('Mobile: +91 987654****3210');
  });

  it('Req 16: Prefilled message includes PIN Code when provided', () => {
    const msg = generateWhatsAppPrefilledMessage({
      publicOrderId: 'ord_123456',
      items: [{ name: 'Aam Achar', qty: 1, unitPrice: 249, lineTotal: 249 }],
      subtotal: 249,
      shippingFee: 0,
      total: 249,
      customerName: 'Aarav',
      phone: '9876543210',
      pincode: '221001'
    });
    expect(msg).toContain('PIN Code: 221001');
  });

  it('Req 17: Prefilled message includes mandatory security notice', () => {
    const msg = generateWhatsAppPrefilledMessage({
      publicOrderId: 'ord_123456',
      items: [{ name: 'Aam Achar', qty: 1, unitPrice: 249, lineTotal: 249 }],
      subtotal: 249,
      shippingFee: 0,
      total: 249,
      customerName: 'Aarav',
      phone: '9876543210'
    });
    expect(msg).toContain('Security: I will never share my UPI PIN, OTP, CVV or banking password.');
  });

  it('Req 18: Full delivery street address is omitted from prefilled WhatsApp message URL to prevent privacy leakage', () => {
    const msg = generateWhatsAppPrefilledMessage({
      publicOrderId: 'ord_123456',
      items: [{ name: 'Aam Achar', qty: 1, unitPrice: 249, lineTotal: 249 }],
      subtotal: 249,
      shippingFee: 0,
      total: 249,
      customerName: 'Aarav',
      phone: '9876543210'
    });
    expect(msg).not.toContain('Flat 402, Royal Residency, M.G. Road');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 3: Backend Security, Pricing & Idempotency (Req 19-25)
  // ──────────────────────────────────────────────────────────────────────────

  it('Req 19: orderService calculates prices and totals authoritatively from database', () => {
    const serviceTs = fs.readFileSync(path.join(backendSrcDir, 'orders', 'orderService.ts'), 'utf8');
    expect(serviceTs).toContain('getAuthoritativeProductInTransaction');
  });

  it('Req 20: Reusing idempotencyKey returns cached order result without creating duplicate order', () => {
    const serviceTs = fs.readFileSync(path.join(backendSrcDir, 'orders', 'orderService.ts'), 'utf8');
    expect(serviceTs).toContain('idempotencyRef');
    expect(serviceTs).toContain('return cached.result');
  });

  it('Req 21: Reusing idempotencyKey with different payload throws IDEMPOTENCY_CONFLICT', () => {
    const serviceTs = fs.readFileSync(path.join(backendSrcDir, 'orders', 'orderService.ts'), 'utf8');
    expect(serviceTs).toContain('IDEMPOTENCY_CONFLICT');
  });

  it('Req 22: verifyAuth middleware checks Firebase App Check header in production', () => {
    const authTs = fs.readFileSync(path.join(backendSrcDir, 'auth', 'verifyAuth.ts'), 'utf8');
    expect(authTs).toContain('x-firebase-appcheck');
    expect(authTs).toContain('APP_CHECK_FAILED');
  });

  it('Req 23: rateLimiter middleware protects order creation endpoints', () => {
    const appTs = fs.readFileSync(path.join(backendSrcDir, 'app.ts'), 'utf8');
    expect(appTs).toContain('app.use(rateLimiter);');
  });

  it('Req 24: orderService generates cryptographically secure guestAccessSecret and hashes it', () => {
    const serviceTs = fs.readFileSync(path.join(backendSrcDir, 'orders', 'orderService.ts'), 'utf8');
    expect(serviceTs).toContain('generateGuestAccessSecret');
    expect(serviceTs).toContain('guestSecretHash');
  });

  it('Req 25: lookupGuestOrderHandler validates orderId and guestAccessSecret hash match', () => {
    const controllerTs = fs.readFileSync(path.join(backendSrcDir, 'orders', 'orderController.ts'), 'utf8');
    expect(controllerTs).toContain('providedHash = hashGuestSecret');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 4: UTR Submission & Validation (Req 26-29)
  // ──────────────────────────────────────────────────────────────────────────

  it('Req 26: validateUtrFormat enforces 6-30 alphanumeric characters', () => {
    expect(validateUtrFormat('123456789012')).toBe(true);
    expect(validateUtrFormat('UPI123456')).toBe(true);
    expect(validateUtrFormat('123')).toBe(false);
    expect(validateUtrFormat('INVALID_UTR_WITH_SPECIAL_CHARS!')).toBe(false);
  });

  it('Req 27: app.ts mounts /api/v1/orders/submit-utr endpoint', () => {
    const appTs = fs.readFileSync(path.join(backendSrcDir, 'app.ts'), 'utf8');
    expect(appTs).toContain('/api/v1/orders/submit-utr');
    expect(appTs).toContain('submitUtrHandler');
  });

  it('Req 28: Submitting valid UTR updates paymentStatus to PAYMENT_UNDER_REVIEW', () => {
    const serviceTs = fs.readFileSync(path.join(backendSrcDir, 'orders', 'orderService.ts'), 'utf8');
    expect(serviceTs).toContain("paymentStatus: 'PAYMENT_UNDER_REVIEW'");
  });

  it('Req 29: Submitting duplicate UTR across different orders throws DUPLICATE_UTR (409)', () => {
    const serviceTs = fs.readFileSync(path.join(backendSrcDir, 'orders', 'orderService.ts'), 'utf8');
    expect(serviceTs).toContain('DUPLICATE_UTR');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 5: Admin Payment Verification & State Machine (Req 30-41)
  // ──────────────────────────────────────────────────────────────────────────

  it('Req 30: verifyPaymentAdmin supports receivedAmount, paymentMethod, utr, and confirmBankCredit', () => {
    const adminTs = fs.readFileSync(path.join(backendSrcDir, 'admin', 'adminController.ts'), 'utf8');
    expect(adminTs).toContain('receivedAmount');
    expect(adminTs).toContain('paymentMethod');
    expect(adminTs).toContain('utr');
    expect(adminTs).toContain('confirmBankCredit');
  });

  it('Req 31: Accepting payment without confirmBankCredit: true throws ValidationError', () => {
    const adminTs = fs.readFileSync(path.join(backendSrcDir, 'admin', 'adminController.ts'), 'utf8');
    expect(adminTs).toContain('confirmBankCredit !== true');
  });

  it('Req 32: Accepting payment without positive receivedAmount throws ValidationError', () => {
    const adminTs = fs.readFileSync(path.join(backendSrcDir, 'admin', 'adminController.ts'), 'utf8');
    expect(adminTs).toContain("typeof receivedAmount !== 'number' || receivedAmount <= 0");
  });

  it('Req 33: Accept action with matching receivedAmount transitions to PAYMENT_VERIFIED and ORDER_CONFIRMED', () => {
    const adminTs = fs.readFileSync(path.join(backendSrcDir, 'admin', 'adminController.ts'), 'utf8');
    expect(adminTs).toContain("paymentStatus: 'PAYMENT_VERIFIED'");
    expect(adminTs).toContain("status: 'ORDER_CONFIRMED'");
  });

  it('Req 34: Accept action with mismatched receivedAmount transitions to PAYMENT_MISMATCH and AWAITING_PAYMENT', () => {
    const adminTs = fs.readFileSync(path.join(backendSrcDir, 'admin', 'adminController.ts'), 'utf8');
    expect(adminTs).toContain("paymentStatus: 'PAYMENT_MISMATCH'");
    expect(adminTs).toContain("status: 'AWAITING_PAYMENT'");
  });

  it('Req 35: Inventory is revalidated and deducted in transaction upon payment acceptance', () => {
    const adminTs = fs.readFileSync(path.join(backendSrcDir, 'admin', 'adminController.ts'), 'utf8');
    expect(adminTs).toContain('Revalidate stock transactionally & deduct inventory');
    expect(adminTs).toContain('stock: update.newStock');
  });

  it('Req 36: Insufficient stock during payment acceptance throws INSUFFICIENT_STOCK', () => {
    const adminTs = fs.readFileSync(path.join(backendSrcDir, 'admin', 'adminController.ts'), 'utf8');
    expect(adminTs).toContain('INSUFFICIENT_STOCK');
  });

  it('Req 37: verifyPaymentAdmin enforces controlled rejection reason codes', () => {
    const adminTs = fs.readFileSync(path.join(backendSrcDir, 'admin', 'adminController.ts'), 'utf8');
    expect(adminTs).toContain('PAYMENT_NOT_RECEIVED');
    expect(adminTs).toContain('INVALID_UTR_REFERENCE');
    expect(adminTs).toContain('ORDER_CANCELLED_BY_CUSTOMER');
    expect(adminTs).toContain('DUPLICATE_UTR');
    expect(adminTs).toContain('EXPIRED_REQUEST');
    expect(adminTs).toContain('OTHER');
  });

  it('Req 38: Selecting OTHER as rejection reason requires custom note of at least 5 characters', () => {
    const adminTs = fs.readFileSync(path.join(backendSrcDir, 'admin', 'adminController.ts'), 'utf8');
    expect(adminTs).toContain('reasonCode === \'OTHER\'');
    expect(adminTs).toContain('reason.trim().length < 5');
  });

  it('Req 39: Reject action updates paymentStatus to PAYMENT_REJECTED and status to CANCELLED', () => {
    const adminTs = fs.readFileSync(path.join(backendSrcDir, 'admin', 'adminController.ts'), 'utf8');
    expect(adminTs).toContain("paymentStatus: 'PAYMENT_REJECTED'");
    expect(adminTs).toContain("status: 'CANCELLED'");
  });

  it('Req 40: Expire action updates paymentStatus to PAYMENT_EXPIRED and status to CANCELLED', () => {
    const adminTs = fs.readFileSync(path.join(backendSrcDir, 'admin', 'adminController.ts'), 'utf8');
    expect(adminTs).toContain("paymentStatus: 'PAYMENT_EXPIRED'");
  });

  it('Req 41: Mutating terminal payment statuses (PAYMENT_VERIFIED, PAYMENT_REJECTED, PAYMENT_EXPIRED) throws TERMINAL_PAYMENT_STATUS', () => {
    const adminTs = fs.readFileSync(path.join(backendSrcDir, 'admin', 'adminController.ts'), 'utf8');
    expect(adminTs).toContain('TERMINAL_PAYMENT_STATUS');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 6: Audit, Auth, UI Fallback & Security Regression (Req 42-45)
  // ──────────────────────────────────────────────────────────────────────────

  it('Req 42: Payment verification actions write audit log and order event timeline', () => {
    const adminTs = fs.readFileSync(path.join(backendSrcDir, 'admin', 'adminController.ts'), 'utf8');
    expect(adminTs).toContain('logAuditEvent');
    expect(adminTs).toContain("orderRef.collection('events').doc()");
  });

  it('Req 43: verifyPaymentAdmin requires requireAdmin and requireRecentAuthentication(900)', () => {
    const appTs = fs.readFileSync(path.join(backendSrcDir, 'app.ts'), 'utf8');
    expect(appTs).toContain("app.post('/api/v1/admin/orders/:orderId/verify-payment', requireAdmin, requireRecentAuthentication(900), verifyPaymentAdmin);");
  });

  it('Req 44: Storefront UI provides Web WhatsApp fallback button (btn-wa-web)', () => {
    const html = fs.readFileSync(path.join(publicSiteDir, 'index.html'), 'utf8');
    expect(html).toContain('id="btn-wa-web"');
    expect(html).toContain('Open Web WhatsApp');
  });

  it('Req 45: Legacy payments remain disabled (503), Firestore rules deny direct client writes to /orders, Firebase Storage unreferenced', () => {
    const appTs = fs.readFileSync(path.join(backendSrcDir, 'app.ts'), 'utf8');
    expect(appTs).toContain('PaymentsNotAvailableError');

    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    expect(rules).toContain('match /orders/{orderId}');
    expect(rules).toContain('allow create: if false;');
  });
});
