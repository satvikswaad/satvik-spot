import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // Application Default Credentials (ADC) or Emulator host initialization
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export { admin };
