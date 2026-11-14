import {
  assertFails,
  initializeTestEnvironment,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const rulesPath = path.join(__dirname, '../../firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');

  testEnv = await initializeTestEnvironment({
    projectId: 'satvik-spot-test',
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080
    }
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

describe('Phase F — DB-1 Universal Deny-All Security Rules Verification', () => {

  const testCollections = [
    'orders',
    'products',
    'users',
    'customers',
    'audit_logs',
    'stockMovements',
    'inventory_logs',
    'payments',
    'payment_transactions',
    'refunds',
    'contactMessages',
    'messages',
    'rateLimits',
    'rate_limits',
    'idempotencyKeys',
    'idempotency',
    'newsletterSubscribers',
    'shifts',
    'redemptions',
    'reservations',
    'reviews',
    'stats_daily',
    'arbitrary_secret_collection'
  ];

  describe('1. Unauthenticated (Anonymous) Client Deny-All', () => {
    testCollections.forEach((coll) => {
      it(`Anonymous client CANNOT read from '${coll}'`, async () => {
        const db = testEnv.unauthenticatedContext().firestore();
        await assertFails(db.collection(coll).get());
        await assertFails(db.collection(coll).doc('sample_id').get());
      });

      it(`Anonymous client CANNOT write to '${coll}'`, async () => {
        const db = testEnv.unauthenticatedContext().firestore();
        await assertFails(db.collection(coll).add({ test: true }));
        await assertFails(db.collection(coll).doc('sample_id').set({ test: true }));
        await assertFails(db.collection(coll).doc('sample_id').update({ test: true }));
        await assertFails(db.collection(coll).doc('sample_id').delete());
      });
    });
  });

  describe('2. Authenticated Regular User (Customer) Client Deny-All', () => {
    testCollections.forEach((coll) => {
      it(`Customer CANNOT read from '${coll}'`, async () => {
        const db = testEnv.authenticatedContext('cust_alice_123').firestore();
        await assertFails(db.collection(coll).get());
        await assertFails(db.collection(coll).doc('sample_id').get());
      });

      it(`Customer CANNOT write to '${coll}'`, async () => {
        const db = testEnv.authenticatedContext('cust_alice_123').firestore();
        await assertFails(db.collection(coll).add({ test: true }));
        await assertFails(db.collection(coll).doc('sample_id').set({ test: true }));
        await assertFails(db.collection(coll).doc('sample_id').update({ test: true }));
        await assertFails(db.collection(coll).doc('sample_id').delete());
      });
    });
  });

  describe('3. Authenticated Admin Client Deny-All (Must use Admin SDK, not Client SDK)', () => {
    testCollections.forEach((coll) => {
      it(`Admin client SDK token CANNOT read from '${coll}'`, async () => {
        const db = testEnv.authenticatedContext('admin_bob_999', { admin: true }).firestore();
        await assertFails(db.collection(coll).get());
        await assertFails(db.collection(coll).doc('sample_id').get());
      });

      it(`Admin client SDK token CANNOT write to '${coll}'`, async () => {
        const db = testEnv.authenticatedContext('admin_bob_999', { admin: true }).firestore();
        await assertFails(db.collection(coll).add({ test: true }));
        await assertFails(db.collection(coll).doc('sample_id').set({ test: true }));
        await assertFails(db.collection(coll).doc('sample_id').update({ test: true }));
        await assertFails(db.collection(coll).doc('sample_id').delete());
      });
    });
  });

  describe('4. Specific High-Risk Vectors from docs/SPEC.md', () => {
    it('Customer CANNOT read or write own user document directly via Client SDK (DB-1)', async () => {
      const db = testEnv.authenticatedContext('cust_alice').firestore();
      await assertFails(db.doc('users/cust_alice').get());
      await assertFails(db.doc('users/cust_alice').set({ name: 'Alice' }));
    });

    it('Customer CANNOT read or write own orders directly via Client SDK (DB-1, ARCH-2)', async () => {
      const db = testEnv.authenticatedContext('cust_alice').firestore();
      await assertFails(db.doc('orders/order_123').get());
      await assertFails(db.collection('orders').add({ total: 100 }));
    });

    it('Customer CANNOT read or tamper with product pricing or stock directly (DB-1, MONEY-6)', async () => {
      const db = testEnv.authenticatedContext('cust_alice').firestore();
      await assertFails(db.doc('products/prod_1').get());
      await assertFails(db.doc('products/prod_1').update({ price: 1 }));
    });
  });
});
