const fs = require('fs');
const path = require('path');

const APPROVED_COLLECTIONS = new Set([
  'products',
  'inventory',
  'reservations',
  'stockMovements',
  'orders',
  'payments',
  'payuTxn',
  'utrIndex',
  'quotes',
  'discounts',
  'redemptions',
  'refunds',
  'users',
  'reviews',
  'contactMessages',
  'config',
  'counters',
  'audit_logs',
  'audit_head',
  'stats_daily',
  'rateLimits',
  'idempotencyKeys',
  'newsletterSubscribers',
  'shifts',
  // Subcollections
  'variants',
  'events',
  'addresses'
]);

// Transitional collections during phased migration (allowed until final lockdown Wave F)
const TRANSITIONAL_COLLECTIONS = new Set([
  'customers',
  'messages',
  'offline_finances',
  'inventory_logs',
  'payment_transactions',
  'paymentAuditLog',
  'idempotency',
  'rate_limits',
  'admin',
  'settings'
]);

const targetDirs = ['backend/src', 'firestore.rules'];
const ignoreDirs = ['node_modules', 'dist', 'archive', 'tests'];

function scanFile(filePath, unapprovedHits, transitionalHits) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(path.resolve(__dirname, '..'), filePath).replace(/\\/g, '/');

  // Regex for collection calls: collection('name'), collection("name"), db.collection('name')
  const collectionRegex = /(?:collection\s*\(\s*['"`]([^'"`]+)['"`]\s*\)|match\s+\/([a-zA-Z0-9_-]+)\/)/g;
  let match;
  while ((match = collectionRegex.exec(content)) !== null) {
    const colName = match[1] || match[2];
    if (colName.startsWith('{') || colName === 'databases') continue;

    if (!APPROVED_COLLECTIONS.has(colName)) {
      if (TRANSITIONAL_COLLECTIONS.has(colName)) {
        transitionalHits.push({ collection: colName, file: relPath });
      } else {
        unapprovedHits.push({ collection: colName, file: relPath });
      }
    }
  }
}

function scanDir(dir, unapprovedHits, transitionalHits) {
  if (!fs.existsSync(dir)) return;
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    scanFile(dir, unapprovedHits, transitionalHits);
    return;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreDirs.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath, unapprovedHits, transitionalHits);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.rules'))) {
      scanFile(fullPath, unapprovedHits, transitionalHits);
    }
  }
}

const unapprovedHits = [];
const transitionalHits = [];

targetDirs.forEach(d => scanDir(path.resolve(__dirname, '..', d), unapprovedHits, transitionalHits));

console.log('=== FIRESTORE COLLECTION SCAN ===');
if (unapprovedHits.length > 0) {
  console.error(`❌ Found ${unapprovedHits.length} unapproved collection references:`);
  unapprovedHits.forEach(h => console.error(`  - Collection '${h.collection}' in ${h.file}`));
  process.exit(1);
} else {
  console.log('✅ Zero unapproved collections found.');
  if (transitionalHits.length > 0) {
    console.log(`ℹ️  Note: Found ${transitionalHits.length} transitional collection references undergoing phased migration.`);
  }
  process.exit(0);
}
