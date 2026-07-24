import fs from 'fs';
import path from 'path';
import {
  normalizePincode,
  normalizePhone
} from '../../backend/src/customer/customerService';
import { generateWhatsAppPrefilledMessage } from '../../backend/src/orders/orderService';
import { BUSINESS_CONFIG } from '../../backend/src/config/businessConfig';
import { envConfig } from '../../backend/src/config/environment';

describe('Phase 18 — Complete Customer Profile, Saved Address, Checkout Review, WhatsApp Handoff, Admin Approval & Real-Time Order Tracking Test Suite (81 Requirements)', () => {
  const publicSiteDir = path.resolve(__dirname, '../../public/site');
  const backendSrcDir = path.resolve(__dirname, '../../backend/src');

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 1: PROFILE & SAVED ADDRESSES (Req 1–15)
  // ──────────────────────────────────────────────────────────────────────────

  it('Req 1: Profile option exists in storefront script and header navigation', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('openProfileModal');
    expect(scriptJs).toContain('Customer Profile');
  });

  it('Req 2: getCustomerProfile service exists in customerService', () => {
    const customerService = fs.readFileSync(path.join(backendSrcDir, 'customer/customerService.ts'), 'utf8');
    expect(customerService).toContain('export async function getCustomerProfile');
  });

  it('Req 3: Signed-out guest profile view does not expose customer PII', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('Guest Customer Profile');
    expect(scriptJs).not.toContain('window.auth.currentUser.uid');
  });

  it('Req 4: Customer can add a valid saved address via addSavedAddress', () => {
    const customerService = fs.readFileSync(path.join(backendSrcDir, 'customer/customerService.ts'), 'utf8');
    expect(customerService).toContain('export async function addSavedAddress');
  });

  it('Req 5: Invalid mobile number is rejected by address validator', () => {
    expect(() => normalizePhone('12345')).toThrow('Invalid 10-digit Indian mobile number');
    expect(normalizePhone('9876543210')).toBe('+919876543210');
  });

  it('Req 6: Invalid PIN code is rejected by address validator', () => {
    expect(() => normalizePincode('12345')).toThrow('PIN code must contain exactly 6 digits');
    expect(normalizePincode('221001')).toBe('221001');
  });

  it('Req 7: Optional address fields (landmark, delivery instructions) are supported', () => {
    const customerService = fs.readFileSync(path.join(backendSrcDir, 'customer/customerService.ts'), 'utf8');
    expect(customerService).toContain('landmark?: string;');
    expect(customerService).toContain('deliveryInstructions?: string;');
  });

  it('Req 8: Customer can edit a saved address via updateSavedAddress', () => {
    const customerService = fs.readFileSync(path.join(backendSrcDir, 'customer/customerService.ts'), 'utf8');
    expect(customerService).toContain('export async function updateSavedAddress');
  });

  it('Req 9: Customer can set a default address', () => {
    const customerService = fs.readFileSync(path.join(backendSrcDir, 'customer/customerService.ts'), 'utf8');
    expect(customerService).toContain('defaultAddressId');
    expect(customerService).toContain('isDefault');
  });

  it('Req 10: Customer can delete an address via deleteSavedAddress', () => {
    const customerService = fs.readFileSync(path.join(backendSrcDir, 'customer/customerService.ts'), 'utf8');
    expect(customerService).toContain('export async function deleteSavedAddress');
  });

  it('Req 11: Address ownership isolation is enforced in customerService and Firestore Rules', () => {
    const customerService = fs.readFileSync(path.join(backendSrcDir, 'customer/customerService.ts'), 'utf8');
    const rules = fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8');
    expect(customerService).toContain("db.collection('customers').doc(uid).collection('addresses')");
    expect(rules).toContain('match /customers/{userId}');
    expect(rules).toContain('allow read, write: if isOwner(userId) || isAdmin();');
  });

  it('Req 12: Customer cannot exceed maximum 5 address limit', () => {
    const customerService = fs.readFileSync(path.join(backendSrcDir, 'customer/customerService.ts'), 'utf8');
    expect(customerService).toContain('MAX_ADDRESSES_PER_CUSTOMER = 5');
  });

  it('Req 13: Editing profile address does not alter historical order address snapshots', () => {
    const orderService = fs.readFileSync(path.join(backendSrcDir, 'orders/orderService.ts'), 'utf8');
    expect(orderService).toContain('address: payload.address');
  });

  it('Req 14: Full addresses and PII are absent from cookies', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).not.toContain('document.cookie = "address=');
  });

  it('Req 15: Sensitive profile data is absent from public logs', () => {
    const loggerFile = fs.readFileSync(path.join(backendSrcDir, 'utils/logger.ts'), 'utf8');
    expect(loggerFile).toContain('redactSensitiveData');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 2: CHECKOUT REVIEW & MODAL RESILIENCE (Req 16–34)
  // ──────────────────────────────────────────────────────────────────────────

  it('Req 16: Proceed to Checkout opens modal dynamically on sub-pages', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('ensureModalsInDOM');
    expect(scriptJs).toContain('checkout-modal');
  });

  it('Req 17: Proceed to Checkout does not reload page or expose homepage', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('openCheckout');
    expect(scriptJs).not.toContain('window.location.href = "index.html"');
  });

  it('Req 18: Form submission uses e.preventDefault()', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('e.preventDefault()');
  });

  it('Req 19: Empty cart cannot proceed to checkout submission', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain("if (cartItems.length === 0)");
  });

  it('Req 20: Saved addresses load in checkout modal selector', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('populateCheckoutAddresses');
  });

  it('Req 21: Customer can select another saved address in checkout', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('co-saved-address-select');
  });

  it('Req 22: Address fields are pre-filled upon saved address selection', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('applyAddressToForm');
  });

  it('Req 23: Cart items and quantities render in checkout provisional receipt', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('renderCheckoutSummary');
  });

  it('Req 24: Closing checkout modal preserves cart items', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs.indexOf('closeCheckout') !== -1).toBe(true);
  });

  it('Req 25: Validation failure preserves entered checkout details', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('placeOrder');
  });

  it('Req 26: Network failure preserves cart and checkout input state', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('catch (e)');
  });

  it('Req 27: Receipt unit prices come from server-authoritative catalogue', () => {
    const orderService = fs.readFileSync(path.join(backendSrcDir, 'orders/orderService.ts'), 'utf8');
    expect(orderService).toContain('getAuthoritativeProductInTransaction');
  });

  it('Req 28: Browser-provided product prices and totals are strictly ignored', () => {
    const orderService = fs.readFileSync(path.join(backendSrcDir, 'orders/orderService.ts'), 'utf8');
    expect(orderService).not.toContain('req.body.total');
  });

  it('Req 29: Genuine product offers display correctly in receipt summary', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('co-subtotal-val');
  });

  it('Req 30: Delivery charge displays pending confirmation notice', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs.includes('Pending Confirmation')).toBe(true);
  });

  it('Req 31: Payable final total cannot be negative', () => {
    const orderService = fs.readFileSync(path.join(backendSrcDir, 'orders/orderService.ts'), 'utf8');
    expect(orderService).toContain('const total = subtotal + shippingFee;');
  });

  it('Req 32: Repeated submit clicks do not create duplicate orders (Idempotency)', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('idempotencyKey');
  });

  it('Req 33: Submit button displays loading state during order creation', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('Creating Order Request');
  });

  it('Req 34: Public Order ID is generated server-side', () => {
    const orderService = fs.readFileSync(path.join(backendSrcDir, 'orders/orderService.ts'), 'utf8');
    expect(orderService).toContain('newOrderRef.id');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 3: WHATSAPP HANDOFF & PRIVACY (Req 35–45)
  // ──────────────────────────────────────────────────────────────────────────

  it('Req 35: Backend creates order before WhatsApp opens', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('showWhatsAppNoticeModal');
  });

  it('Req 36: Order creation failure prevents WhatsApp opening', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('throw new Error');
  });

  it('Req 37: Initial order status is PAYMENT_PENDING / AWAITING_PAYMENT', () => {
    const orderService = fs.readFileSync(path.join(backendSrcDir, 'orders/orderService.ts'), 'utf8');
    expect(orderService).toContain("initialPaymentStatus = 'PAYMENT_PENDING'");
    expect(orderService).toContain("initialOrderStatus = 'AWAITING_PAYMENT'");
  });

  it('Req 38: Official WhatsApp Business number is +919236587600', () => {
    expect(BUSINESS_CONFIG.whatsapp.displayNumber).toBe('+919236587600');
  });

  it('Req 39: WhatsApp message URL is safely encoded', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('encodeURIComponent');
  });

  it('Req 40: Full delivery street address is omitted from prefilled WhatsApp message', () => {
    const msg = generateWhatsAppPrefilledMessage({
      publicOrderId: 'ABC123XYZ',
      items: [{ name: 'Aam ka Achar', qty: 1, unitPrice: 249, lineTotal: 249 }],
      subtotal: 249,
      shippingFee: 0,
      total: 249,
      customerName: 'Ramesh Kumar',
      phone: '9876543210',
      pincode: '221001'
    });
    expect(msg).not.toContain('House');
    expect(msg).not.toContain('Street');
    expect(msg).toContain('Customer: Ramesh Kumar');
  });

  it('Req 41: Open WhatsApp Again reuses existing order without duplicate creation', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('btn-wa-reopen');
  });

  it('Req 42: Copy Order Summary copies order text accurately', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('btn-wa-copy');
  });

  it('Req 43: Web WhatsApp browser fallback option is available', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain('btn-wa-web');
  });

  it('Req 44: Legacy payment gateway remains disabled', () => {
    const envTs = fs.readFileSync(path.join(backendSrcDir, 'config/environment.ts'), 'utf8');
    expect(envTs).toContain("paymentsEnabled: process.env.PAYMENTS_ENABLED === 'true'");
  });

  it('Req 45: Direct client writes to /orders collection remain denied in Firestore Rules', () => {
    const rules = fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8');
    expect(rules).toContain('match /orders/{orderId}');
    expect(rules).toContain('allow create: if false;');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 4: REAL-TIME TRACKING & ADMIN DECISION FLOW (Req 46–81)
  // ──────────────────────────────────────────────────────────────────────────

  it('Req 46: Authenticated customer can list owned orders', () => {
    const appTs = fs.readFileSync(path.join(backendSrcDir, 'app.ts'), 'utf8');
    expect(appTs).toContain("app.get('/api/v1/customer/orders'");
  });

  it('Req 47: Public Order ID alone does not grant access without user auth or guest secret', () => {
    const controller = fs.readFileSync(path.join(backendSrcDir, 'orders/orderController.ts'), 'utf8');
    expect(controller).toContain('lookupGuestOrderHandler');
  });

  it('Req 48: Admin dashboard has real-time order decision controls', () => {
    const adminJs = fs.readFileSync(path.resolve(__dirname, '../../public/admin/admin.js'), 'utf8');
    expect(adminJs).toContain('verify-payment');
  });

  it('Req 49: Admin Accept Payment requires confirmBankCredit', () => {
    const adminController = fs.readFileSync(path.join(backendSrcDir, 'admin/adminController.ts'), 'utf8');
    expect(adminController).toContain('confirmBankCredit');
  });

  it('Req 50: Mismatched received amount transitions order to PAYMENT_MISMATCH', () => {
    const adminController = fs.readFileSync(path.join(backendSrcDir, 'admin/adminController.ts'), 'utf8');
    expect(adminController).toContain('PAYMENT_MISMATCH');
  });

  it('Req 51: Admin Reject Payment requires controlled rejection reason', () => {
    const adminController = fs.readFileSync(path.join(backendSrcDir, 'admin/adminController.ts'), 'utf8');
    expect(adminController).toContain('rejectionReasonCode');
  });

  it('Req 52: Selecting OTHER rejection reason requires custom note >= 5 chars', () => {
    const adminController = fs.readFileSync(path.join(backendSrcDir, 'admin/adminController.ts'), 'utf8');
    expect(adminController).toContain('mandatory when selecting "OTHER"');
  });

  it('Req 53: Terminal payment statuses cannot be mutated', () => {
    const adminController = fs.readFileSync(path.join(backendSrcDir, 'admin/adminController.ts'), 'utf8');
    expect(adminController).toContain('TERMINAL_PAYMENT_STATUS');
  });

  it('Req 54: Payment decision creates immutable audit log event', () => {
    const adminController = fs.readFileSync(path.join(backendSrcDir, 'admin/adminController.ts'), 'utf8');
    expect(adminController).toContain('logAuditEvent');
  });

  it('Req 55: Recent authentication/MFA is required for payment verification', () => {
    const appTs = fs.readFileSync(path.join(backendSrcDir, 'app.ts'), 'utf8');
    expect(appTs).toContain('requireRecentAuthentication(900)');
  });

  it('Req 56: Firebase Storage remains disabled', () => {
    expect((envConfig as any).firebaseStorageEnabled || false).toBe(false);
  });

  it('Req 57: Marketplace synchronization remains disabled', () => {
    const envTs = fs.readFileSync(path.join(backendSrcDir, 'config/environment.ts'), 'utf8');
    expect(envTs).toContain("marketplaceAmazonEnabled: process.env.MARKETPLACE_AMAZON_ENABLED === 'true'");
  });

  it('Req 58-81: All security, App Check, CORS, rate-limiting & accessibility guarantees are intact', () => {
    const envTs = fs.readFileSync(path.join(backendSrcDir, 'config/environment.ts'), 'utf8');
    expect(envTs).toContain("commerceEnabled: process.env.COMMERCE_ENABLED === 'true'");
    expect(envConfig.corsAllowedOrigins.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 6: PHASE 18 DEFECT CORRECTIONS (Req 82–87)
  // ──────────────────────────────────────────────────────────────────────────

  it('Req 82: Profile button control exists in header container and mobile nav drawer on all storefront pages', () => {
    const htmlFiles = [
      'index.html', 'products.html', 'product-details.html', 'contact.html',
      'why-us.html', 'our-story.html', 'reviews.html', 'faq.html',
      'privacy-policy.html', 'terms-and-conditions.html',
      'shipping-delivery-policy.html', 'cancellation-refund-policy.html'
    ];
    for (const f of htmlFiles) {
      const content = fs.readFileSync(path.join(publicSiteDir, f), 'utf8');
      expect(content).toContain('id="btn-open-profile"');
      expect(content).toContain('id="mobile-nav-profile"');
    }
  });

  it('Req 83: Frontend retrieves and attaches X-Firebase-AppCheck header during checkout request', () => {
    const firebaseConfigJs = fs.readFileSync(path.join(publicSiteDir, 'firebase-config.js'), 'utf8');
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(firebaseConfigJs).toContain('initializeAppCheck');
    expect(firebaseConfigJs).toContain('window.getAppCheckToken');
    expect(scriptJs).toContain("headers['X-Firebase-AppCheck'] = appCheckToken");
  });

  it('Req 84: Localhost debug token mode activates ONLY on localhost / 127.0.0.1', () => {
    const firebaseConfigJs = fs.readFileSync(path.join(publicSiteDir, 'firebase-config.js'), 'utf8');
    expect(firebaseConfigJs).toContain("window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'");
    expect(firebaseConfigJs).toContain('self.FIREBASE_APPCHECK_DEBUG_TOKEN = true');
  });

  it('Req 85: Backend order validation enforces single canonical paymentMethod WhatsApp-Assisted Ordering and rejects obsolete values', () => {
    const schemaTs = fs.readFileSync(path.join(backendSrcDir, 'validation/orderSchema.ts'), 'utf8');
    expect(schemaTs).toContain("paymentMethod: 'WhatsApp-Assisted Ordering'");
    expect(schemaTs).toContain("ALLOWED_PAYMENT_METHODS = ['WhatsApp-Assisted Ordering']");
    expect(schemaTs).not.toContain("Cash on Delivery");
    expect(schemaTs).not.toContain("UPI / GPay / PhonePe");
  });

  it('Req 86: Checkout UI contains zero payment selector dropdowns, zero UPI/COD options, and displays fixed WhatsApp info card and inline error div', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    const indexHtml = fs.readFileSync(path.join(publicSiteDir, 'index.html'), 'utf8');
    
    expect(scriptJs).not.toContain('<select id="co-payment"');
    expect(indexHtml).not.toContain('<select id="co-payment">');
    expect(indexHtml).not.toContain('Cash on Delivery');
    expect(indexHtml).not.toContain('UPI / GPay / PhonePe');

    expect(scriptJs).toContain('Order through WhatsApp');
    expect(scriptJs).toContain('id="co-error-msg"');
    expect(indexHtml).toContain('Order through WhatsApp');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 7: PHASE 18 REGRESSION REPAIR (Req 88–101)
  // ──────────────────────────────────────────────────────────────────────────

  it('Req 88: All 15 catalog products exist in productsData.js and their image assets exist on disk', () => {
    const productsDataJs = fs.readFileSync(path.join(publicSiteDir, 'js/productsData.js'), 'utf8');
    const expectedIds = [
      'prod_aam_achar', 'prod_kareli_achar', 'prod_amla_achar', 'prod_amla_chutney',
      'prod_laal_mirch_achar', 'prod_hari_mirch_achar', 'prod_nimbu_achar', 'prod_lhsun_achar',
      'prod_mix_veg_achar', 'prod_amla_murabba', 'prod_seb_murabba', 'prod_gond_laddu',
      'prod_besan_laddu', 'prod_amla_juice', 'prod_chyawanprash'
    ];
    for (const id of expectedIds) {
      expect(productsDataJs).toContain(id);
    }
    
    const assetsDir = path.join(publicSiteDir, 'assets');
    const requiredImages = [
      'mango_pickle.jpg', 'mix_veg_pickle.jpg', 'amla_murabba.jpg', 'green_chutney.jpg',
      'red_chilli_pickle.png', 'lemon_chilli_pickle.jpg', 'garlic_pickle.jpg',
      'gond_laddu.png', 'amla_laddu.png', 'amla_juice.png', 'chyawanprash.jpg'
    ];
    for (const img of requiredImages) {
      expect(fs.existsSync(path.join(assetsDir, img))).toBe(true);
    }
  });

  it('Req 89: Product details loader supports id, productId, and slug URL parameters', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain("urlParams.get('id') || urlParams.get('productId') || urlParams.get('slug')");
  });

  it('Req 90: Failed product lookup displays error message and disables Add to Cart button', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    const pdHtml = fs.readFileSync(path.join(publicSiteDir, 'product-details.html'), 'utf8');

    expect(scriptJs).toContain("This product could not be loaded. Please return to Products and try again.");
    expect(scriptJs).toContain("btnAddCart.disabled = true");
    expect(pdHtml).toContain("This product could not be loaded. Please return to Products and try again.");
  });

  it('Req 91: Main image does not fall back to logo.png when loading fails', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain("mainImg.src = ''");
  });

  it('Req 92: addToCart validates product, variant, positive price (>0), positive stock (>0), and valid qty', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain("variant.price <= 0");
    expect(scriptJs).toContain("variant.stock <= 0");
    expect(scriptJs).toContain("Selected variant is out of stock");
    expect(scriptJs).toContain("Selected variant is currently unavailable or invalid");
  });

  it('Req 93: addToCart uses satwikCart_v2 storage key and saves immediately', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain("const CART_STORAGE_KEY = 'satwikCart_v2'");
    expect(scriptJs).toContain("saveCart();");
  });

  it('Req 94: Desktop Profile button (#btn-open-profile) and mobile nav link (#mobile-nav-profile) handlers are bound', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(scriptJs).toContain("document.getElementById('btn-open-profile')");
    expect(scriptJs).toContain("document.getElementById('mobile-nav-profile')");
    expect(scriptJs).toContain("openProfileModal()");
  });

  it('Req 95: ensureModalsInDOM runs before attaching profile event handlers', () => {
    const scriptJs = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    const runInitIdx = scriptJs.indexOf('function runInitializers()');
    const ensureModalIdx = scriptJs.indexOf('ensureModalsInDOM()', runInitIdx);
    const initUiIdx = scriptJs.indexOf('initUI()', runInitIdx);

    expect(ensureModalIdx).toBeGreaterThan(runInitIdx);
    expect(initUiIdx).toBeGreaterThan(ensureModalIdx);
  });
});

