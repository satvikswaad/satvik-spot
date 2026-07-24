import * as admin from 'firebase-admin';
import * as fs from 'fs';

/**
 * Trusted Local Owner-Operated Firebase Admin Provisioning CLI Tool
 *
 * Usage:
 *   npx ts-node scripts/admin-cli.ts --action grant-owner --uid <uid> --project <projectId> [--confirm] [--dry-run]
 *   npx ts-node scripts/admin-cli.ts --action revoke-admin --uid <uid> --project <projectId> [--confirm] [--dry-run]
 *   npx ts-node scripts/admin-cli.ts --action inspect-admin --uid <uid> --project <projectId>
 *   npx ts-node scripts/admin-cli.ts --action revoke-sessions --uid <uid> --project <projectId> [--confirm]
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

function redactUid(uid: string): string {
  if (!uid || uid.length <= 6) return '****';
  return `${uid.substring(0, 3)}...${uid.substring(uid.length - 3)}`;
}

function redactEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'N/A';
  const parts = email.split('@');
  const user = parts[0];
  const domain = parts[1];
  const redactedUser = user.length > 2 ? `${user.substring(0, 2)}***` : '***';
  return `${redactedUser}@${domain}`;
}

async function main() {
  const flags = parseArgs();
  const action = flags.action as string;
  const uid = flags.uid as string;
  const project = flags.project as string;
  const confirm = flags.confirm === true;
  const dryRun = flags['dry-run'] === true;

  console.log('====================================================');
  console.log('      SATWIK SPOT — OWNER ADMIN PROVISIONING CLI    ');
  console.log('====================================================');

  if (!project) {
    console.error('❌ Security Error: Explicit --project <projectId> is required. Default project fallbacks are forbidden.');
    process.exit(1);
  }

  if (project === 'satwiksweetsandpickels') {
    console.error('❌ Security Error: Legacy project ID satwiksweetsandpickels is forbidden.');
    process.exit(1);
  }

  console.log(`📌 Target Firebase Project: [ ${project} ]`);
  console.log(`🔍 Dry-Run Mode: [ ${dryRun ? 'YES (No Mutations)' : 'NO (Live Claim Changes)'} ]`);

  if (!action || !['grant-owner', 'grant-admin', 'revoke-admin', 'inspect-admin', 'revoke-sessions'].includes(action)) {
    console.error('❌ Error: Valid --action required: grant-owner | revoke-admin | inspect-admin | revoke-sessions');
    process.exit(1);
  }

  if (!uid) {
    console.error('❌ Error: --uid <targetUserUid> parameter is required');
    process.exit(1);
  }

  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.FIRESTORE_EMULATOR_HOST !== undefined || process.env.NODE_ENV === 'test';

  // Initialize Admin SDK with emulator host or local credentials
  if (isEmulator) {
    if (!admin.apps.length) admin.initializeApp({ projectId: project });
  } else {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
      console.error('❌ Security Error: GOOGLE_APPLICATION_CREDENTIALS environment variable must point to valid service account JSON file');
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
    console.log(`👤 Target User Verified: Redacted UID=[ ${redactUid(userRecord.uid)} ], Email=[ ${redactEmail(userRecord.email)} ], Disabled=[ ${userRecord.disabled} ]`);
  } catch (e) {
    console.error(`❌ Error: User with target UID not found in Firebase Auth`);
    process.exit(1);
  }

  if (userRecord.disabled) {
    console.error('❌ Security Violation: Target user is disabled. Promotion of disabled accounts is forbidden.');
    process.exit(1);
  }

  const existingClaims = userRecord.customClaims || {};

  switch (action) {
    case 'inspect-admin': {
      console.log('🔍 Current Custom Claims:', JSON.stringify(existingClaims, null, 2));
      console.log(`🔍 Metadata: Created=${userRecord.metadata.creationTime}, LastSignIn=${userRecord.metadata.lastSignInTime}`);
      break;
    }

    case 'grant-owner':
    case 'grant-admin': {
      if (dryRun) {
        console.log(`ℹ️ DRY-RUN SUCCESS: Proposed custom claims for UID [ ${redactUid(uid)} ]:`);
        console.log(JSON.stringify({ admin: true, role: 'admin_owner', schemaVersion: 1 }, null, 2));
        console.log('ℹ️ No changes written in dry-run mode.');
        return;
      }

      if (!confirm) {
        console.warn('⚠️ Safety Warning: Live claim promotion requires confirmation flag --confirm');
        process.exit(1);
      }

      const updatedClaims = {
        ...existingClaims,
        admin: true,
        role: 'admin_owner',
        schemaVersion: 1,
        roles: ['admin_owner', 'admin']
      };

      await auth.setCustomUserClaims(uid, updatedClaims);
      await auth.revokeRefreshTokens(uid);
      console.log(`✅ SUCCESS: Granted 'admin_owner' custom claim and forced token refresh for UID [ ${redactUid(uid)} ]`);

      await db.collection('audit_logs').add({
        action: 'ADMIN_OWNER_GRANTED',
        actorUid: 'OFFLINE_OWNER_CLI',
        targetUid: userRecord.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      break;
    }

    case 'revoke-admin': {
      if (dryRun) {
        console.log(`ℹ️ DRY-RUN SUCCESS: Proposed claim removal for UID [ ${redactUid(uid)} ]`);
        return;
      }

      if (!confirm) {
        console.warn('⚠️ Safety Warning: Destructive revocation requires confirmation flag --confirm');
        process.exit(1);
      }

      const { admin: _, role: __, schemaVersion: ___, roles: ____, ...preservedClaims } = existingClaims;
      const updatedClaims = { ...preservedClaims, admin: false, role: 'customer' };

      await auth.setCustomUserClaims(uid, updatedClaims);
      await auth.revokeRefreshTokens(uid);
      console.log(`⛔ SUCCESS: Revoked administrative claims and terminated refresh tokens for UID [ ${redactUid(uid)} ]`);

      await db.collection('audit_logs').add({
        action: 'ADMIN_REVOKED',
        actorUid: 'OFFLINE_OWNER_CLI',
        targetUid: userRecord.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      break;
    }

    case 'revoke-sessions': {
      if (!confirm) {
        console.warn('⚠️ Safety Warning: Session termination requires confirmation flag --confirm');
        process.exit(1);
      }

      await auth.revokeRefreshTokens(uid);
      console.log(`🔐 SUCCESS: Revoked all active refresh tokens for UID [ ${redactUid(uid)} ]`);

      await db.collection('audit_logs').add({
        action: 'SESSIONS_REVOKED',
        actorUid: 'OFFLINE_OWNER_CLI',
        targetUid: userRecord.uid,
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
