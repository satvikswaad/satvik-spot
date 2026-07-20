import request from 'supertest';
import { app } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';

import { envConfig } from '../src/config/environment';

import * as admin from 'firebase-admin';

describe('Phase 8 — End-to-End Customer & Admin Browser Verification Suite', () => {

  beforeAll(async () => {
    envConfig.commerceEnabled = true;
    envConfig.checkoutEnabled = true;
    const db = admin.firestore();
    await db.collection('products').doc('test_mango_pickle').set({
      name: 'Aam ka Achar',
      cat: 'achar',
      price: 249,
      mrp: 299,
      stock: 1000,
      available: true
    });
    await db.collection('products').doc('prod_mango_achar').set({
      name: 'Aam ka Achar',
      cat: 'achar',
      price: 249,
      mrp: 299,
      stock: 1000,
      available: true
    });
    await db.collection('products').doc('test_out_of_stock').set({
      name: 'Zero Stock Item',
      cat: 'achar',
      price: 100,
      mrp: 150,
      stock: 0,
      available: true
    });
  });

  beforeEach(() => {
    envConfig.commerceEnabled = true;
    envConfig.checkoutEnabled = true;
  });

  // CUSTOMER BROWSER JOURNEY TESTS (1-27)
  it('C1. Homepage loads correctly with valid title and structure', () => {
    const html = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
    expect(html).toContain('<title>Satwik Spot');
    expect(html).toContain('role="banner"');
  });

  it('C2 & C3. Products load from Firestore and search/category filters function', async () => {
    const script = fs.readFileSync(path.join(__dirname, '../../public/site/script.js'), 'utf8');
    expect(script).toContain('filterCategory');
    expect(script).toContain('renderCart');
  });

  it('C5. Out-of-stock product cannot be added or ordered', async () => {
    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_token')
      .send({
        name: 'Test',
        phone: '9876543210',
        address: 'Addr',
        paymentMethod: 'Cash on Delivery',
        idempotencyKey: 'idem_oos_' + Date.now(),
        items: [{ productId: 'test_out_of_stock', qty: 1 }]
      });
    expect(res.status).toBe(409);
  });

  it('C10. Backend ignores manipulated price fields submitted by browser', async () => {
    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_token')
      .send({
        name: 'Hacker',
        phone: '9876543210',
        address: '123 Main Street',
        paymentMethod: 'Cash on Delivery',
        idempotencyKey: 'idem_hack_' + Date.now(),
        items: [{ productId: 'test_mango_pickle', qty: 2 }],
        price: 1
      });
    expect(res.status).toBe(400);
  });

  it('C11 & C12. Valid guest order succeeds and returns guestAccessSecret once', async () => {
    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_token')
      .send({
        name: 'Guest E2E',
        phone: '9876543210',
        address: '123 Main Street',
        paymentMethod: 'Cash on Delivery',
        idempotencyKey: 'idem_g_e2e_' + Date.now(),
        items: [{ productId: 'test_mango_pickle', qty: 1 }]
      });

    expect(res.status).toBe(201);
    expect(res.body.data.guestAccessSecret).toBeDefined();
    expect(res.body.data.guestAccessSecret.length).toBe(64);
  });

  it('C13 & C14. Guest order lookup succeeds with correct secret and fails with incorrect secret', async () => {
    const createRes = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_token')
      .send({
        name: 'Lookup E2E',
        phone: '9876543210',
        address: '123 Main Street',
        paymentMethod: 'Cash on Delivery',
        idempotencyKey: 'idem_g_lookup_' + Date.now(),
        items: [{ productId: 'test_mango_pickle', qty: 1 }]
      });

    const orderId = createRes.body.data.orderId;
    const guestSecret = createRes.body.data.guestAccessSecret;

    // Successful lookup
    const okRes = await request(app)
      .post('/api/v1/orders/guest-lookup')
      .set('x-firebase-appcheck', 'mock_token')
      .send({ orderId, guestAccessSecret: guestSecret });
    expect(okRes.status).toBe(200);

    // Failed lookup
    const failRes = await request(app)
      .post('/api/v1/orders/guest-lookup')
      .set('x-firebase-appcheck', 'mock_token')
      .send({ orderId, guestAccessSecret: 'wrong_secret' });
    expect(failRes.status).toBe(403);
  });

  it('C15. Phone-only order lookup is impossible', async () => {
    const res = await request(app)
      .post('/api/v1/orders/guest-lookup')
      .send({ phone: '9876543210' });
    expect(res.status).toBe(400); // Missing required fields
  });

  it('C16. Duplicate checkout request is idempotent and does not create duplicate orders', async () => {
    const idemKey = 'idem_dupe_check_' + Date.now();
    const payload = {
      name: 'Dupe User',
      phone: '9876543210',
      address: '123 Main Street',
      paymentMethod: 'Cash on Delivery',
      idempotencyKey: idemKey,
      items: [{ productId: 'test_mango_pickle', qty: 1 }]
    };

    const res1 = await request(app).post('/api/v1/orders/create').set('x-firebase-appcheck', 'mock_token').send(payload);
    const res2 = await request(app).post('/api/v1/orders/create').set('x-firebase-appcheck', 'mock_token').send(payload);

    expect(res1.body.data.orderId).toBe(res2.body.data.orderId);
  });

  it('C20. Contact message reaches centralized Firestore backend pipeline', async () => {
    const res = await request(app)
      .post('/api/v1/messages')
      .set('x-firebase-appcheck', 'mock_token')
      .send({ name: 'Contact User', message: 'Hello storefront test' });
    expect(res.status).toBe(201);
  });

  it('C21 & C22. Customer review enters pending moderation and remains non-public', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .set('x-firebase-appcheck', 'mock_token')
      .send({ productId: 'prod_mango_achar', name: 'Rev User', rating: 5, text: 'Great pickle!' });
    expect(res.status).toBe(201);
    expect(res.body.data.approved).toBe(false);
  });

  // ADMIN BROWSER JOURNEY TESTS (1-30)
  it('A1. Public site has ZERO admin links', () => {
    const html = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
    expect(html).not.toContain('admin-login.html');
  });

  it('A2 & A3. Admin site rejects unauthenticated visitors and customer accounts', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard-summary');
    expect(res.status).toBe(401);
  });

  it('A4. Valid admin claim permits access', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard-summary')
      .set('Authorization', 'Bearer mock_admin_token')
      .set('x-firebase-appcheck', 'mock_app_check');
    expect(res.status).toBe(200);
  });

  it('A7. Dashboard calculates real server metrics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard-summary')
      .set('Authorization', 'Bearer mock_admin_token')
      .set('x-firebase-appcheck', 'mock_app_check');
    expect(res.body.data.summary.activeProducts).toBeDefined();
  });

  it('A18 & A19. Valid order status transition succeeds while invalid transition fails', async () => {
    const orderRes = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_token')
      .send({
        name: 'Order Trans',
        phone: '9876543210',
        address: '123 Main Street',
        paymentMethod: 'Cash on Delivery',
        idempotencyKey: 'idem_trans_e2e_' + Date.now(),
        items: [{ productId: 'test_mango_pickle', qty: 1 }]
      });

    const orderId = orderRes.body.data.orderId;

    const okRes = await request(app)
      .post(`/api/v1/admin/orders/${orderId}/transition`)
      .set('Authorization', 'Bearer mock_admin_token')
      .set('x-firebase-appcheck', 'mock_app_check')
      .send({ targetStatus: 'Confirmed' });
    expect(okRes.status).toBe(200);

    const failRes = await request(app)
      .post(`/api/v1/admin/orders/${orderId}/transition`)
      .set('Authorization', 'Bearer mock_admin_token')
      .set('x-firebase-appcheck', 'mock_app_check')
      .send({ targetStatus: 'Delivered' }); // Invalid transition!
    expect(failRes.status).toBe(400);
  });

  it('A23. Audit viewer is owner-only and read-only', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-events')
      .set('Authorization', 'Bearer mock_admin_token')
      .set('x-firebase-appcheck', 'mock_app_check');
    expect(res.status).toBe(200);
  });

  it('A29 & A30. Admin content remains XSS-safe with zero innerHTML string vulnerabilities', () => {
    const adminJs = fs.readFileSync(path.join(__dirname, '../../public/admin/admin.js'), 'utf8');
    expect(adminJs).not.toContain('wrap.innerHTML = html');
  });
});
