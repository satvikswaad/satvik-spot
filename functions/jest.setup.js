process.env.FUNCTIONS_EMULATOR = 'true';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.NODE_ENV = 'test';
process.env.COMMERCE_ENABLED = 'true';
process.env.CHECKOUT_ENABLED = 'true';
process.env.PAYMENTS_ENABLED = 'true';
process.env.PUBLIC_INDEXING_ENABLED = 'true';

const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'satwiksweetsandpickels' });
}
