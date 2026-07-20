import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Local Emulator Backup Export Script
 * Exports Firestore emulator collection documents into structured JSON backups.
 */
async function exportBackup() {
  const project = process.env.FIREBASE_PROJECT_ID || 'satwiksweetsandpickels';
  console.log(`📦 Exporting Local Emulator Backup for Project [ ${project} ]...`);

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: project });
  }

  const db = admin.firestore();
  const collections = ['products', 'orders', 'messages', 'reviews', 'audit_logs'];
  const backupData: Record<string, any[]> = {};

  for (const col of collections) {
    const snap = await db.collection(col).get();
    backupData[col] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`   - Backed up collection '${col}': ${snap.docs.length} documents.`);
  }

  const backupDir = path.join(__dirname, '../backup_export');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, 'emulator_backup_latest.json');
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

  console.log(`✅ Backup successfully exported to: ${backupFile}`);
}

exportBackup().catch(err => {
  console.error('❌ Backup Export Failed:', err.message);
  process.exit(1);
});
