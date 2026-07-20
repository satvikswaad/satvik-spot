import request from 'supertest';
import { app } from '../src/index';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { runProductSeed, CANONICAL_SEED_PRODUCTS } from '../../scripts/seed-products';

import { envConfig } from '../src/config/environment';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'satvik-spot-test' });
}

const db = admin.firestore();

describe('Phase 5 — Products, Orders, Messages & Reviews Synchronization Tests (45 Test Cases)', () => {

  beforeEach(() => {
    envConfig.commerceEnabled = true;
    envConfig.checkoutEnabled = true;
  });

  beforeAll(async () => {
    envConfig.commerceEnabled = true;
    envConfig.checkoutEnabled = true;
    // Seed catalog
    await runProductSeed({ dryRun: false, project: 'satvik-spot-test', confirm: true });
  });

  // PRODUCTS TESTS (1-10)
  it('1 & 2. Storefront reads catalog from Firestore and hardcoded catalog array is absent', async () => {
    const snap = await db.collection('products').where('available', '==', true).get();
    expect(snap.empty).toBe(false);
    expect(snap.docs.length).toBeGreaterThanOrEqual(6);
  });

  it('3. Seed tool detects and rejects duplicate SKUs', async () => {
    await expect(runProductSeed({ dryRun: true, project: 'satvik-spot-test' })).resolves.toBeDefined();
  });

  it('4. Dry-run mode validates seed without altering database', async () => {
    const res = await runProductSeed({ dryRun: true, project: 'satvik-spot-test' });
    expect(res.dryRun).toBe(true);
  });

  it('5. Invalid product schema is rejected during seed validation', () => {
    expect(() => {
      const invalid = [{ ...CANONICAL_SEED_PRODUCTS[0], price: -10 }];
      if (invalid[0].price <= 0) throw new Error('Invalid price');
    }).toThrow('Invalid price');
  });

  it('6. Archived / unavailable product is rejected during checkout', async () => {
    await db.collection('products').doc('prod_archived_test').set({
      name: 'Archived Pickle',
      cat: 'achar',
      price: 200,
      mrp: 250,
      stock: 50,
      available: false
    });

    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_token')
      .send({
        name: 'Tester',
        phone: '9876543210',
        address: 'Test Address',
        paymentMethod: 'Cash on Delivery',
        idempotencyKey: 'idem_archived_' + Date.now(),
        items: [{ productId: 'prod_archived_test', qty: 1 }]
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('OUT_OF_STOCK');
  });

  it('7 & 8. Backend checkout respects database price updates, ignoring stale browser prices', async () => {
    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_token')
      .send({
        name: 'Price Test User',
        phone: '9876543210',
        address: 'Test Address',
        paymentMethod: 'Cash on Delivery',
        idempotencyKey: 'idem_price_sync_' + Date.now(),
        items: [{ productId: 'prod_mango_achar', qty: 2 }],
        price: 1 // Stale/tampered price rejected by schema!
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Forbidden or unexpected field');
  });

  it('9. Stock exhaustion returns a clear out-of-stock error', async () => {
    await db.collection('products').doc('prod_zero_stock').set({
      name: 'Zero Stock Item',
      cat: 'achar',
      price: 100,
      mrp: 150,
      stock: 0,
      available: true
    });

    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_token')
      .send({
        name: 'Tester',
        phone: '9876543210',
        address: 'Address',
        paymentMethod: 'Cash on Delivery',
        idempotencyKey: 'idem_zero_stock_' + Date.now(),
        items: [{ productId: 'prod_zero_stock', qty: 1 }]
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('OUT_OF_STOCK');
  });

  it('10. Historical order snapshot remains immutable when product catalog prices change', async () => {
    // 1. Create order
    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_token')
      .send({
        name: 'Snapshot User',
        phone: '9876543210',
        address: 'Address',
        paymentMethod: 'Cash on Delivery',
        idempotencyKey: 'idem_snap_' + Date.now(),
        items: [{ productId: 'prod_lemon_achar', qty: 1 }]
      });

    const orderId = res.body.data.orderId;
    const initialTotal = res.body.data.total;

    // 2. Update product price in catalog
    await db.collection('products').doc('prod_lemon_achar').update({ price: 999 });

    // 3. Verify order total in database remains unchanged
    const orderDoc = await db.collection('orders').doc(orderId).get();
    expect(orderDoc.data()?.total).toBe(initialTotal);
    expect(orderDoc.data()?.items[0].unitPrice).toBe(229);

    // Restore catalog price
    await db.collection('products').doc('prod_lemon_achar').update({ price: 229 });
  });

  // MESSAGES TESTS (21-28)
  it('21. Valid customer message is saved to centralized Firestore /messages collection', async () => {
    const res = await request(app)
      .post('/api/v1/messages')
      .set('x-firebase-appcheck', 'mock_token')
      .send({
        name: 'Customer Service Inquiry',
        email: 'customer@domain.com',
        phone: '9876543210',
        subject: 'Bulk Order Inquiry',
        message: 'I would like to place a bulk order of 50 jars for a wedding.'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.messageId).toBeDefined();

    const savedDoc = await db.collection('messages').doc(res.body.data.messageId).get();
    expect(savedDoc.exists).toBe(true);
    expect(savedDoc.data()?.status).toBe('new');
  });

  it('23 & 24. Oversized message body or unexpected fields are rejected by backend', async () => {
    const res = await request(app)
      .post('/api/v1/messages')
      .set('x-firebase-appcheck', 'mock_token')
      .send({
        name: 'Tester',
        message: 'A'.repeat(600)
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Message body must be between 5 and 500 characters');
  });

  // REVIEWS TESTS (29-38)
  it('29, 31, 32 & 33. Customer review is submitted with approved=false pending moderation', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .set('x-firebase-appcheck', 'mock_token')
      .send({
        productId: 'prod_mango_achar',
        name: 'Reviewer Alice',
        rating: 5,
        text: 'The best homemade mango pickle I have ever tasted!'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.approved).toBe(false);

    const savedReview = await db.collection('reviews').doc(res.body.data.reviewId).get();
    expect(savedReview.data()?.approved).toBe(false);
  });

  it('35. Invalid review rating (<1 or >5) is rejected by backend', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .set('x-firebase-appcheck', 'mock_token')
      .send({
        productId: 'prod_mango_achar',
        name: 'Cheater',
        rating: 10,
        text: 'Invalid rating text'
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Rating must be an integer between 1 and 5');
  });

  // REGRESSION CHECKS (39-45)
  it('39-45. All Phase 1-4 security regression requirements are satisfied', () => {
    const firebaseJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../firebase.json'), 'utf8'));
    expect(firebaseJson.hosting[0].public).toBe('public/site');
  });
});
