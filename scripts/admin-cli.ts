import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Trusted Local Firebase Admin SDK CLI Tool
 *
 * Usage:
 *   npx ts-node scripts/admin-cli.ts --action grant-admin --uid <uid> [--project <projectId>] [--confirm]
 *   npx ts-node scripts/admin-cli.ts --action revoke-admin --uid <uid> [--project <projectId>] [--confirm]
 *   npx ts-node scripts/admin-cli.ts --action inspect-admin --uid <uid> [--project <projectId>]
 *   npx ts-node scripts/admin-cli.ts --action revoke-sessions --uid <uid> [--project <projectId>] [--confirm]
 */

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        parsed[key] = nextArg;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }

  return parsed;
}

async function main() {
  const flags = parseArgs();
  const action = flags.action as string;
  const uid = flags.uid as string;
  const project = (flags.project as string) || process.env.GCP_PROJECT || process.env.FIREBASE_PROJECT_ID || 'satwiksweetsandpickels';
  const confirm = flags.confirm === true;

  console.log('====================================================');
  console.log('      SATWIK SPOT — LOCAL ADMIN PROVISIONING CLI     ');
  console.log('====================================================');
  console.log(`📌 Selected Target Firebase Project: [ ${project} ]`);

  if (!action || !['grant-admin', 'revoke-admin', 'inspect-admin', 'revoke-sessions'].includes(action)) {
    console.error('❌ Error: Valid --action required: grant-admin | revoke-admin | inspect-admin | revoke-sessions');
    process.exit(1);
  }

  if (!uid) {
    console.error('❌ Error: --uid <targetUserUid> parameter is required');
    process.exit(1);
  }

  // Refuse execution against production without explicit --project flag
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.FIRESTORE_EMULATOR_HOST !== undefined;
  if (!isEmulator && (!flags.project || flags.project !== 'satwiksweetsandpickels')) {
    console.error('❌ Security Check Failed: Production execution requires explicit --project <projectId> flag');
    process.exit(1);
  }

  // Initialize Admin SDK with emulator host or local credentials
  if (isEmulator) {
    if (!admin.apps.length) admin.initializeApp({ projectId: project });
  } else {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
      console.error('❌ Error: GOOGLE_APPLICATION_CREDENTIALS environment variable must point to valid service account JSON file');
      process.exit(1);
    }
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        projectId: project
      });
    }
  }

  const auth = admin.auth();
  const db = admin.firestore();

  // 1. Retrieve & Confirm Target User Record
  let userRecord: admin.auth.UserRecord;
  try {
    userRecord = await auth.getUser(uid);
    console.log(`👤 Target User Confirmed: UID=[ ${userRecord.uid} ], Email=[ ${userRecord.email || 'N/A'} ], Disabled=[ ${userRecord.disabled} ]`);
  } catch (e) {
    console.error(`❌ Error: User with UID '${uid}' not found in Firebase Auth`);
    process.exit(1);
  }

  const existingClaims = userRecord.customClaims || {};

  switch (action) {
    case 'inspect-admin': {
      console.log('🔍 Current Custom Claims:', JSON.stringify(existingClaims, null, 2));
      console.log(`🔍 Metadata: Created=${userRecord.metadata.creationTime}, LastSignIn=${userRecord.metadata.lastSignInTime}`);
      break;
    }

    case 'grant-admin': {
      if (!confirm) {
        console.warn('⚠️ Safety Warning: Operation requires confirmation flag --confirm');
        process.exit(1);
      }
      // Preserve unrelated existing custom claims
      const updatedClaims = {
        ...existingClaims,
        admin: true,
        roles: Array.from(new Set([...(existingClaims.roles || []), 'owner']))
      };

      await auth.setCustomUserClaims(uid, updatedClaims);
      console.log(`✅ SUCCESS: Granted 'admin: true' custom claim to UID [ ${uid} ]`);

      // Write Audit Log Record to Firestore /audit_logs
      await db.collection('audit_logs').add({
        action: 'ADMIN_GRANTED',
        actorUid: 'CLI_OPERATOR',
        targetUid: uid,
        targetEmail: userRecord.email || 'N/A',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      break;
    }

    case 'revoke-admin': {
      if (!confirm) {
        console.warn('⚠️ Safety Warning: Destructive operation requires confirmation flag --confirm');
        process.exit(1);
      }
      const { admin: _, roles: __, ...preservedClaims } = existingClaims;
      const updatedClaims = { ...preservedClaims, admin: false };

      await auth.setCustomUserClaims(uid, updatedClaims);
      await auth.revokeRefreshTokens(uid);
      console.log(`⛔ SUCCESS: Revoked 'admin' custom claim and terminated refresh tokens for UID [ ${uid} ]`);

      await db.collection('audit_logs').add({
        action: 'ADMIN_REVOKED',
        actorUid: 'CLI_OPERATOR',
        targetUid: uid,
        targetEmail: userRecord.email || 'N/A',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      break;
    }

    case 'revoke-sessions': {
      if (!confirm) {
        console.warn('⚠️ Safety Warning: Destructive operation requires confirmation flag --confirm');
        process.exit(1);
      }
      await auth.revokeRefreshTokens(uid);
      console.log(`🔐 SUCCESS: Revoked all active refresh tokens for UID [ ${uid} ]`);

      await db.collection('audit_logs').add({
        action: 'SESSIONS_REVOKED',
        actorUid: 'CLI_OPERATOR',
        targetUid: uid,
        targetEmail: userRecord.email || 'N/A',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      break;
    }
  }

  console.log('====================================================');
}

main().catch(err => {
  console.error('❌ Fatal CLI Error:', err.message);
  process.exit(1);
});
