import request from 'supertest';
import { app } from '../src/index';
import * as admin from 'firebase-admin';

import { envConfig } from '../src/config/environment';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'satvik-spot-test' });
}

const db = admin.firestore();

describe('Phase 1 — Trusted Backend & Authoritative Order Pipeline Unit Tests (Revised)', () => {
  beforeEach(() => {
    envConfig.commerceEnabled = true;
    envConfig.checkoutEnabled = true;
  });

  beforeAll(async () => {
    envConfig.commerceEnabled = true;
    envConfig.checkoutEnabled = true;
    await db.collection('products').doc('test_mango_pickle').set({
      name: 'Aam ka Achar',
      cat: 'achar',
      price: 249,
      mrp: 320,
      stock: 50,
      available: true
    });

    await db.collection('products').doc('test_out_of_stock').set({
      name: 'Lahsun Achar',
      cat: 'achar',
      price: 209,
      mrp: 270,
      stock: 0,
      available: true
    });
  });

  it('1. Successfully processes valid authenticated order and calculates total on server', async () => {
    const payload = {
      name: 'Ravi Sharma',
      phone: '9876543210',
      address: '123 Park Street, Sector 5, Delhi',
      paymentMethod: 'Cash on Delivery',
      idempotencyKey: 'idem_test_auth_001_' + Date.now(),
      items: [{ productId: 'test_mango_pickle', qty: 2 }]
    };

    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_app_check_token')
      .set('Authorization', 'Bearer mock_valid_token')
      .send(payload);

    if (res.status !== 201) {
      console.log('TEST 1 ERROR BODY:', res.body);
    }

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subtotal).toBe(498);
    expect(res.body.data.shippingFee).toBe(50);
    expect(res.body.data.total).toBe(548);
    expect(res.body.data.status).toBe('Pending');
    expect(res.body.data.paymentStatus).toBe('COD_Pending');
  });

  it('2. Successfully processes valid guest order and returns high-entropy guestAccessSecret once', async () => {
    const payload = {
      name: 'Guest Customer',
      phone: '9876543211',
      address: '456 Civil Lines, Jaipur',
      paymentMethod: 'UPI / GPay / PhonePe',
      idempotencyKey: 'idem_test_guest_002_' + Date.now(),
      items: [{ productId: 'test_mango_pickle', qty: 3 }]
    };

    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_app_check_token')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.guestAccessSecret).toBeDefined();
    expect(res.body.data.guestAccessSecret.length).toBe(64);
    expect(res.body.data.total).toBe(747);
  });

  it('3. Ignores client-provided price or total if injected in request body', async () => {
    const payload = {
      name: 'Attacker User',
      phone: '9876543212',
      address: '789 Malicious Way',
      paymentMethod: 'Cash on Delivery',
      idempotencyKey: 'idem_test_tamper_003_' + Date.now(),
      items: [{ productId: 'test_mango_pickle', qty: 1 }],
      price: 1,
      total: 1
    };

    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_app_check_token')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('Forbidden or unexpected field');
  });

  it('4. Rejects order specifying non-existent product ID', async () => {
    const payload = {
      name: 'Priya Sharma',
      phone: '9876543213',
      address: 'Plot 12, Gandhi Nagar',
      paymentMethod: 'Cash on Delivery',
      idempotencyKey: 'idem_test_invalid_prod_004_' + Date.now(),
      items: [{ productId: 'non_existent_product_999', qty: 1 }]
    };

    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_app_check_token')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('not found in store catalog');
  });

  it('5. Rejects items containing unexpected variant or extra fields', async () => {
    const payload = {
      name: 'Testing User',
      phone: '9876543214',
      address: 'Address Line 1, City',
      paymentMethod: 'Cash on Delivery',
      idempotencyKey: 'idem_test_variant_005_' + Date.now(),
      items: [{ productId: 'test_mango_pickle', qty: 1, customDiscount: 100 } as any]
    };

    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_app_check_token')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Forbidden field in item object');
  });

  it('6. Rejects item quantity exceeding single-order max limit (>10)', async () => {
    const payload = {
      name: 'Bulk Purchaser',
      phone: '9876543215',
      address: 'Main Market Road',
      paymentMethod: 'Bank Transfer',
      idempotencyKey: 'idem_test_excess_006_' + Date.now(),
      items: [{ productId: 'test_mango_pickle', qty: 99 }]
    };

    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_app_check_token')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('quantity must be an integer between 1 and 10');
  });

  it('7. Rejects order for out-of-stock item', async () => {
    const payload = {
      name: 'Customer B',
      phone: '9876543216',
      address: 'Street 4, Sector 2',
      paymentMethod: 'Cash on Delivery',
      idempotencyKey: 'idem_test_outofstock_007_' + Date.now(),
      items: [{ productId: 'test_out_of_stock', qty: 1 }]
    };

    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_app_check_token')
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('OUT_OF_STOCK');
  });

  it('8. Idempotency protection returns cached result for identical payload', async () => {
    const idemKey = 'idem_test_duplicate_008_' + Date.now();
    const payload = {
      name: 'Repeat Orderer',
      phone: '9876543217',
      address: 'Near City Mall',
      paymentMethod: 'Cash on Delivery',
      idempotencyKey: idemKey,
      items: [{ productId: 'test_mango_pickle', qty: 1 }]
    };

    const res1 = await request(app).post('/api/v1/orders/create').set('x-firebase-appcheck', 'mock_app_check_token').send(payload);
    expect(res1.status).toBe(201);
    const orderId1 = res1.body.data.orderId;

    const res2 = await request(app).post('/api/v1/orders/create').set('x-firebase-appcheck', 'mock_app_check_token').send(payload);
    expect(res2.status).toBe(201);
    expect(res2.body.data.orderId).toBe(orderId1);
  });

  it('8b. Returns HTTP 409 Conflict when idempotency key is reused with a different payload', async () => {
    const idemKey = 'idem_test_conflict_008b_' + Date.now();
    const payload1 = {
      name: 'User One',
      phone: '9876543218',
      address: 'Address 1',
      paymentMethod: 'Cash on Delivery',
      idempotencyKey: idemKey,
      items: [{ productId: 'test_mango_pickle', qty: 1 }]
    };

    const payload2 = {
      name: 'User One',
      phone: '9876543218',
      address: 'Address 1 DIFFERENT', // Different payload!
      paymentMethod: 'Cash on Delivery',
      idempotencyKey: idemKey,
      items: [{ productId: 'test_mango_pickle', qty: 2 }]
    };

    const res1 = await request(app).post('/api/v1/orders/create').set('x-firebase-appcheck', 'mock_app_check_token').send(payload1);
    expect(res1.status).toBe(201);

    const res2 = await request(app).post('/api/v1/orders/create').set('x-firebase-appcheck', 'mock_app_check_token').send(payload2);
    expect(res2.status).toBe(409);
    expect(res2.body.error.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('9. Rejects attempt by customer to specify userId field in request body', async () => {
    const payload = {
      name: 'Imposter User',
      phone: '9876543219',
      address: 'Sample Address 123',
      paymentMethod: 'Cash on Delivery',
      idempotencyKey: 'idem_test_userId_009_' + Date.now(),
      items: [{ productId: 'test_mango_pickle', qty: 1 }],
      userId: 'victim_user_uid_777'
    };

    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_app_check_token')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("Forbidden or unexpected field in request: 'userId'");
  });

  it('10. Rejects attempt by customer to specify order status or paymentStatus', async () => {
    const payload = {
      name: 'Cheater User',
      phone: '9876543220',
      address: 'Sample Address 456',
      paymentMethod: 'UPI / GPay / PhonePe',
      idempotencyKey: 'idem_test_status_010_' + Date.now(),
      items: [{ productId: 'test_mango_pickle', qty: 1 }],
      status: 'Delivered',
      paymentStatus: 'Paid'
    };

    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('x-firebase-appcheck', 'mock_app_check_token')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Forbidden or unexpected field');
  });

  it('11. Guest lookup rejects request missing invalid guest secret', async () => {
    const res = await request(app)
      .post('/api/v1/orders/guest-lookup')
      .set('x-firebase-appcheck', 'mock_app_check_token')
      .send({ orderId: 'some_order_id', guestAccessSecret: 'wrong_secret_key' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('12. Guest lookup fails when provided guestAccessSecret is invalid', async () => {
    const payload = {
      name: 'Guest Lookup Test',
      phone: '9876543221',
      address: 'Lookup Address',
      paymentMethod: 'Cash on Delivery',
      idempotencyKey: 'idem_test_lookup_012_' + Date.now(),
      items: [{ productId: 'test_mango_pickle', qty: 1 }]
    };

    const createRes = await request(app).post('/api/v1/orders/create').set('x-firebase-appcheck', 'mock_app_check_token').send(payload);
    const orderId = createRes.body.data.orderId;

    const lookupRes = await request(app)
      .post('/api/v1/orders/guest-lookup')
      .set('x-firebase-appcheck', 'mock_app_check_token')
      .send({ orderId, guestAccessSecret: 'invalid_secret_key_1234567890' });

    expect(lookupRes.status).toBe(403);
    expect(lookupRes.body.error.message).toContain('Invalid guest access secret');
  });

  it('13. Rejects malformed payload or payload exceeding size limit', async () => {
    const hugeAddress = 'A'.repeat(500);
    const payload = {
      name: 'Test',
      phone: '9876543222',
      address: hugeAddress,
      paymentMethod: 'Cash on Delivery',
      idempotencyKey: 'idem_test_huge_013_' + Date.now(),
      items: [{ productId: 'test_mango_pickle', qty: 1 }]
    };

    const res = await request(app).post('/api/v1/orders/create').set('x-firebase-appcheck', 'mock_app_check_token').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Delivery address must be between 5 and 300 characters');
  });

  it('14. Production mode rejects requests missing x-firebase-appcheck header', async () => {
    const oldEnv = process.env.FUNCTIONS_EMULATOR;
    delete process.env.FUNCTIONS_EMULATOR;
    delete process.env.NODE_ENV;

    const payload = {
      name: 'No AppCheck User',
      phone: '9876543223',
      address: 'Prod AppCheck Address',
      paymentMethod: 'Cash on Delivery',
      idempotencyKey: 'idem_test_prod_appcheck_014_' + Date.now(),
      items: [{ productId: 'test_mango_pickle', qty: 1 }]
    };

    const res = await request(app)
      .post('/api/v1/orders/create')
      .send(payload); // No x-firebase-appcheck header!

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('APP_CHECK_FAILED');

    // Restore env
    process.env.FUNCTIONS_EMULATOR = oldEnv || 'true';
  });
});
