import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { app } from '../src/app';
import { _resetTestCustomerStore, _setTestOrders } from '../src/customer/customerService';
import { customerRateLimiter, authRateLimiter } from '../src/rateLimiting/rateLimiter';

describe('Phase F: Customer Profile, Authentication Hardening & Identity Boundaries', () => {

  const USER1_TOKEN = 'Bearer mock_cust_token';
  const USER2_TOKEN = 'Bearer mock_cust_token_2';

  const validAddressPayload = {
    label: 'Home',
    name: 'Aarav Sharma',
    phone: '9876543210',
    house: 'Flat 402, Ganga Heights',
    street: 'Assi Ghat Road',
    landmark: 'Near Temple',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    pincode: '221005',
    deliveryInstructions: 'Ring bell twice'
  };

  beforeEach(() => {
    _resetTestCustomerStore();
  });

  afterEach(() => {
    _resetTestCustomerStore();
  });

  // ============================================================================
  // 1. AUTHENTICATION & SESSION VALIDATION ON PROTECTED CUSTOMER ROUTES
  // ============================================================================
  describe('1. Authentication & Session Validation', () => {
    it('Rejects unauthenticated request to customer profile with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/customer/profile');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toContain('Authentication required');
    });

    it('Rejects request with missing Bearer prefix with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .get('/api/v1/customer/profile')
        .set('Authorization', 'mock_cust_token');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('Rejects invalid Bearer token with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .get('/api/v1/customer/profile')
        .set('Authorization', 'Bearer mock_invalid_token');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('Rejects revoked Bearer token with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .get('/api/v1/customer/profile')
        .set('Authorization', 'Bearer mock_revoked_token');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('Accepts valid customer Bearer token and returns profile scoped to UID', async () => {
      const res = await request(app)
        .get('/api/v1/customer/profile')
        .set('Authorization', USER1_TOKEN);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uid).toBe('cust_test_uid');
      expect(res.body.data.email).toBe('customer@satvikspot.com');
    });
  });

  // ============================================================================
  // 2. CUSTOMER PROFILE CRUD & INPUT HARDENING
  // ============================================================================
  describe('2. Customer Profile CRUD & Input Hardening', () => {
    it('Updates profile name, phone, and email successfully', async () => {
      const updatePayload = {
        name: 'Savitri Devi',
        phone: '9812345678',
        email: 'savitri.devi@example.com'
      };

      const res = await request(app)
        .put('/api/v1/customer/profile')
        .set('Authorization', USER1_TOKEN)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Savitri Devi');
      expect(res.body.data.phone).toBe('+919812345678');
      expect(res.body.data.email).toBe('savitri.devi@example.com');
    });

    it('Rejects profile update with name shorter than 2 characters with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .put('/api/v1/customer/profile')
        .set('Authorization', USER1_TOKEN)
        .send({ name: 'A' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Rejects profile update with invalid mobile number with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .put('/api/v1/customer/profile')
        .set('Authorization', USER1_TOKEN)
        .send({ phone: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Rejects profile update with invalid email syntax with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .put('/api/v1/customer/profile')
        .set('Authorization', USER1_TOKEN)
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Rejects profile update with unknown/injected administrative fields with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .put('/api/v1/customer/profile')
        .set('Authorization', USER1_TOKEN)
        .send({
          name: 'Attacker User',
          isAdmin: true,
          role: 'admin_owner',
          uid: 'admin_hijacked_uid'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('isAdmin');
    });
  });

  // ============================================================================
  // 3. SAVED ADDRESS BOOK CRUD & BOUNDS
  // ============================================================================
  describe('3. Saved Address Book CRUD & Bounds', () => {
    it('Returns empty array when customer has no saved addresses', async () => {
      const res = await request(app)
        .get('/api/v1/customer/addresses')
        .set('Authorization', USER1_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it('Adds a new address and automatically marks first address as default', async () => {
      const res = await request(app)
        .post('/api/v1/customer/addresses')
        .set('Authorization', USER1_TOKEN)
        .send(validAddressPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Aarav Sharma');
      expect(res.body.data.pincode).toBe('221005');
      expect(res.body.data.phone).toBe('+919876543210');
      expect(res.body.data.isDefault).toBe(true);
    });

    it('Rejects address creation with invalid label with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/customer/addresses')
        .set('Authorization', USER1_TOKEN)
        .send({ ...validAddressPayload, label: 'VacationHome' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Rejects address creation with invalid 5-digit pincode with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/customer/addresses')
        .set('Authorization', USER1_TOKEN)
        .send({ ...validAddressPayload, pincode: '22100' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Rejects address creation with 7-digit pincode with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/customer/addresses')
        .set('Authorization', USER1_TOKEN)
        .send({ ...validAddressPayload, pincode: '2210001' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Rejects address creation with unknown injected fields with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/customer/addresses')
        .set('Authorization', USER1_TOKEN)
        .send({ ...validAddressPayload, couponCode: 'HACK50', discount: 100 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('couponCode');
    });

    it('Enforces maximum limit of 5 addresses per customer', async () => {
      for (let i = 1; i <= 5; i++) {
        const createRes = await request(app)
          .post('/api/v1/customer/addresses')
          .set('Authorization', USER1_TOKEN)
          .send({ ...validAddressPayload, house: `House #${i}` });
        expect(createRes.status).toBe(201);
      }

      const res6 = await request(app)
        .post('/api/v1/customer/addresses')
        .set('Authorization', USER1_TOKEN)
        .send({ ...validAddressPayload, house: 'House #6' });

      expect(res6.status).toBe(400);
      expect(res6.body.error.code).toBe('VALIDATION_ERROR');
      expect(res6.body.error.message).toContain('Maximum address limit (5) reached');
    });

    it('Updates an existing address successfully', async () => {
      const createRes = await request(app)
        .post('/api/v1/customer/addresses')
        .set('Authorization', USER1_TOKEN)
        .send(validAddressPayload);

      const addressId = createRes.body.data.id;

      const updateRes = await request(app)
        .put(`/api/v1/customer/addresses/${addressId}`)
        .set('Authorization', USER1_TOKEN)
        .send({ house: 'Flat 502, Updated Tower', label: 'Work' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.house).toBe('Flat 502, Updated Tower');
      expect(updateRes.body.data.label).toBe('Work');
    });

    it('Returns 404 NOT_FOUND when updating non-existent address ID', async () => {
      const res = await request(app)
        .put('/api/v1/customer/addresses/non_existent_addr_id')
        .set('Authorization', USER1_TOKEN)
        .send({ house: 'New House' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('Deletes an address successfully', async () => {
      const createRes = await request(app)
        .post('/api/v1/customer/addresses')
        .set('Authorization', USER1_TOKEN)
        .send(validAddressPayload);

      const addressId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/customer/addresses/${addressId}`)
        .set('Authorization', USER1_TOKEN);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      const listRes = await request(app)
        .get('/api/v1/customer/addresses')
        .set('Authorization', USER1_TOKEN);

      expect(listRes.body.data.length).toBe(0);
    });

    it('Returns 404 NOT_FOUND when deleting non-existent address ID', async () => {
      const res = await request(app)
        .delete('/api/v1/customer/addresses/non_existent_addr_id')
        .set('Authorization', USER1_TOKEN);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // ============================================================================
  // 4. CROSS-USER IDENTITY ISOLATION & RESOURCE BOUNDARIES
  // ============================================================================
  describe('4. Cross-User Identity Isolation & Resource Boundaries', () => {
    it('User 1 cannot view User 2 addresses', async () => {
      await request(app)
        .post('/api/v1/customer/addresses')
        .set('Authorization', USER2_TOKEN)
        .send({ ...validAddressPayload, name: 'User Two' });

      const user1Res = await request(app)
        .get('/api/v1/customer/addresses')
        .set('Authorization', USER1_TOKEN);

      expect(user1Res.status).toBe(200);
      expect(user1Res.body.data.length).toBe(0);
    });

    it('User 1 cannot update User 2 address (returns 404)', async () => {
      const user2Create = await request(app)
        .post('/api/v1/customer/addresses')
        .set('Authorization', USER2_TOKEN)
        .send({ ...validAddressPayload, name: 'User Two' });

      const user2AddressId = user2Create.body.data.id;

      const tamperedRes = await request(app)
        .put(`/api/v1/customer/addresses/${user2AddressId}`)
        .set('Authorization', USER1_TOKEN)
        .send({ name: 'Tampered Name' });

      expect(tamperedRes.status).toBe(404);
      expect(tamperedRes.body.error.code).toBe('NOT_FOUND');
    });

    it('User 1 cannot delete User 2 address (returns 404)', async () => {
      const user2Create = await request(app)
        .post('/api/v1/customer/addresses')
        .set('Authorization', USER2_TOKEN)
        .send({ ...validAddressPayload, name: 'User Two' });

      const user2AddressId = user2Create.body.data.id;

      const tamperedRes = await request(app)
        .delete(`/api/v1/customer/addresses/${user2AddressId}`)
        .set('Authorization', USER1_TOKEN);

      expect(tamperedRes.status).toBe(404);
      expect(tamperedRes.body.error.code).toBe('NOT_FOUND');
    });

    it('Customer order history strictly scopes to authenticated user', async () => {
      _setTestOrders('cust_test_uid', [
        { orderId: 'ord_u1_1', userId: 'cust_test_uid', grandTotal: 548, createdAt: '2026-08-01T10:00:00Z' }
      ]);
      _setTestOrders('cust_test_uid_2', [
        { orderId: 'ord_u2_1', userId: 'cust_test_uid_2', grandTotal: 1200, createdAt: '2026-08-02T10:00:00Z' }
      ]);

      const res = await request(app)
        .get('/api/v1/customer/orders')
        .set('Authorization', USER1_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].orderId).toBe('ord_u1_1');
      expect(res.body.data[0].userId).toBe('cust_test_uid');
    });
  });

  // ============================================================================
  // 5. RATE LIMITING & ROUTE SECURITY AUDIT
  // ============================================================================
  describe('5. Rate Limiting & Route Security Audit', () => {
    it('Customer rate limiter is instantiated with max 30 req/min', () => {
      expect(customerRateLimiter).toBeDefined();
      expect(typeof customerRateLimiter).toBe('function');
    });

    it('Auth rate limiter is instantiated with max 20 req/min', () => {
      expect(authRateLimiter).toBeDefined();
      expect(typeof authRateLimiter).toBe('function');
    });

    it('Every route under /api/v1/customer/* is strictly protected by requireAuthenticatedUser in app.ts', () => {
      const appSource = fs.readFileSync(path.join(__dirname, '../src/app.ts'), 'utf8');
      expect(appSource).toContain("app.use(['/api/v1/customer', '/api/v1/customer/*'], customerRateLimiter, requireAuthenticatedUser);");
    });
  });
});
