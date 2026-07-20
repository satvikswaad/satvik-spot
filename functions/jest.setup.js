process.env.FUNCTIONS_EMULATOR = 'true';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'satvik-spot-test';
process.env.FIREBASE_PROJECT_ID = 'satvik-spot-test';
process.env.NODE_ENV = 'test';
process.env.COMMERCE_ENABLED = 'true';
process.env.CHECKOUT_ENABLED = 'true';
process.env.PAYMENTS_ENABLED = 'true';
process.env.PUBLIC_INDEXING_ENABLED = 'true';

const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'satvik-spot-test' });
}

afterAll(async () => {
  await Promise.all(admin.apps.map(app => app && app.delete && app.delete().catch(() => {})));
});
