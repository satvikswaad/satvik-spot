/**
 * Regulatory-Pending Launch Gates Fixture Tests (10 Test Cases)
 *
 * Proves server-authoritative feature gates, regulatory pending status handling,
 * staging safety restrictions, noindex policies, and commerce/payment rejection.
 */

process.env.FUNCTIONS_EMULATOR = 'true';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

import request from 'supertest';
import { app } from '../src/index';
import { envConfig, validateFssaiFormat, validateGstinFormat } from '../src/config/environment';
import { AmazonSPAPIAdapter } from '../src/marketplace/amazonAdapter';
import { FlipkartAdapter } from '../src/marketplace/flipkartAdapter';
import * as fs from 'fs';
import * as path from 'path';

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'satvik-spot-test' });
}
process.env.FUNCTIONS_EMULATOR = 'true';

const amazon = new AmazonSPAPIAdapter();
const flipkart = new FlipkartAdapter();

describe('Regulatory-Pending Launch Gates Tests (10 Test Cases)', () => {

  beforeEach(() => {
    envConfig.commerceEnabled = true;
    envConfig.checkoutEnabled = true;
    envConfig.paymentsEnabled = true;
    envConfig.publicIndexingEnabled = true;
  });

  afterEach(() => {
    envConfig.commerceEnabled = true;
    envConfig.checkoutEnabled = true;
    envConfig.paymentsEnabled = true;
    envConfig.publicIndexingEnabled = true;
  });

  afterAll(() => {
    envConfig.commerceEnabled = true;
    envConfig.checkoutEnabled = true;
    envConfig.paymentsEnabled = true;
    envConfig.publicIndexingEnabled = true;
  });

  it('1. Pending FSSAI state displays no fake number', () => {
    expect(envConfig.fssaiStatus).toBe('pending');
    expect(envConfig.fssaiNumber).toBe('');

    const htmlContent = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
    expect(htmlContent).toContain('FSSAI Licence: <strong>PENDING</strong>');
    expect(htmlContent).not.toMatch(/10019042000000/);
  });

  it('2. Pending GST state displays no fake GSTIN', () => {
    expect(envConfig.gstStatus).toBe('pending');
    expect(envConfig.gstin).toBe('');

    const htmlContent = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
    expect(htmlContent).toContain('GSTIN: <strong>PENDING</strong>');
    expect(htmlContent).not.toMatch(/22AAAAA0000A1Z5/);
  });

  it('3. Checkout UI displays notice when online ordering is pending', () => {
    const htmlContent = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
    expect(htmlContent).toContain('Online ordering will open after required registrations and launch preparations are completed.');
  });

  it('4. Direct backend order request is rejected when COMMERCE_ENABLED=false', async () => {
    try {
      envConfig.commerceEnabled = false;
      envConfig.checkoutEnabled = false;

      const payload = {
        name: 'Test Customer',
        phone: '9876543210',
        address: '123 Test Street, City',
        paymentMethod: 'Cash on Delivery',
        idempotencyKey: 'idem_reg_gate_004_' + Date.now(),
        items: [{ productId: 'test_mango_pickle', qty: 1 }]
      };

      const res = await request(app)
        .post('/api/v1/orders/create')
        .set('x-firebase-appcheck', 'mock_app_check_token')
        .send(payload);

      if (res.status !== 503) {
        console.error('TEST 4 FAILED! ACTUAL STATUS:', res.status, 'BODY:', JSON.stringify(res.body));
      }

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('COMMERCE_NOT_AVAILABLE');
      expect(res.body.error.message).toContain('Online ordering will open after required registrations');
    } finally {
      envConfig.commerceEnabled = true;
      envConfig.checkoutEnabled = true;
    }
  });

  it('5. Payment request is rejected when PAYMENTS_ENABLED=false', async () => {
    try {
      envConfig.paymentsEnabled = false;

      const res = await request(app)
        .post('/api/v1/payments/process')
        .set('x-firebase-appcheck', 'mock_app_check_token')
        .send({ amount: 500, currency: 'INR' });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PAYMENTS_NOT_AVAILABLE');
      expect(res.body.error.message).toContain('disabled');
    } finally {
      envConfig.paymentsEnabled = true;
    }
  });

  it('6. Amazon connector remains disabled regardless of browser settings', async () => {
    expect(amazon.enabled).toBe(false);
    await expect(amazon.authorize()).rejects.toThrow('disabled');
    await expect(amazon.fetchOrders(new Date())).rejects.toThrow('disabled');
  });

  it('7. Flipkart connector remains disabled regardless of browser settings', async () => {
    expect(flipkart.enabled).toBe(false);
    await expect(flipkart.authorize()).rejects.toThrow('disabled');
    await expect(flipkart.fetchOrders(new Date())).rejects.toThrow('disabled');
  });

  it('8. Staging has noindex header and robots disallow policy', async () => {
    try {
      envConfig.publicIndexingEnabled = false;

      const res = await request(app).get('/api/v1/health');
      expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');

      const robotsTxt = fs.readFileSync(path.join(__dirname, '../../public/site/robots.txt'), 'utf8');
      expect(robotsTxt).toContain('Disallow: /');
    } finally {
      envConfig.publicIndexingEnabled = true;
    }
  });

  it('9. Application reference number is not displayed or accepted as a valid licence number', () => {
    const arnNumber = 'ARN12345678901';
    expect(validateFssaiFormat(arnNumber)).toBe(false);
    expect(validateGstinFormat(arnNumber)).toBe(false);
  });

  it('10. Browser cannot enable commerce by modifying client JavaScript', async () => {
    try {
      envConfig.commerceEnabled = false;

      const payload = {
        name: 'Hacker User',
        phone: '9876543210',
        address: '123 Hack Way',
        paymentMethod: 'Cash on Delivery',
        idempotencyKey: 'idem_reg_gate_010_' + Date.now(),
        items: [{ productId: 'test_mango_pickle', qty: 1 }],
        commerceEnabled: true
      };

      const res = await request(app)
        .post('/api/v1/orders/create')
        .set('x-firebase-appcheck', 'mock_app_check_token')
        .send(payload);

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('COMMERCE_NOT_AVAILABLE');
    } finally {
      envConfig.commerceEnabled = true;
    }
  });
});
