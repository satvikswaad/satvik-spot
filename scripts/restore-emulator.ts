import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Local Emulator Restore Script
 * Restores Firestore emulator data from local JSON backup exports.
 */
async function restoreBackup() {
  const project = process.env.FIREBASE_PROJECT_ID || 'satwiksweetsandpickels';
  console.log(`🔄 Restoring Local Emulator Data for Project [ ${project} ]...`);

  const backupFile = path.join(__dirname, '../backup_export/emulator_backup_latest.json');
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found at: ${backupFile}`);
  }

  const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: project });
  }

  const db = admin.firestore();

  for (const [colName, docs] of Object.entries(backupData)) {
    const batch = db.batch();
    for (const doc of docs as any[]) {
      const { id, ...data } = doc;
      const ref = db.collection(colName).doc(id);
      batch.set(ref, data);
    }
    await batch.commit();
    console.log(`   - Restored collection '${colName}': ${(docs as any[]).length} documents.`);
  }

  console.log('✅ Local Emulator Data successfully restored!');
}

restoreBackup().catch(err => {
  console.error('❌ Restore Failed:', err.message);
  process.exit(1);
});
