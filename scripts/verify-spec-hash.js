const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const specPath = path.resolve(__dirname, '../docs/SPEC.md');
const hashPath = path.resolve(__dirname, '../docs/SPEC.sha256');

if (!fs.existsSync(specPath)) {
  console.error('❌ Error: docs/SPEC.md does not exist.');
  process.exit(1);
}

if (!fs.existsSync(hashPath)) {
  console.error('❌ Error: docs/SPEC.sha256 does not exist.');
  process.exit(1);
}

const specBuffer = fs.readFileSync(specPath);
const computedHash = crypto.createHash('sha256').update(specBuffer).digest('hex');
const expectedHashLine = fs.readFileSync(hashPath, 'utf8').trim();
const expectedHash = expectedHashLine.split(/\s+/)[0].toLowerCase();

if (computedHash.toLowerCase() === expectedHash) {
  console.log(`✅ Spec hash verified: ${computedHash}`);
  process.exit(0);
} else {
  console.error('❌ SPEC TAMPERING DETECTED!');
  console.error(`  Expected: ${expectedHash}`);
  console.error(`  Computed: ${computedHash}`);
  process.exit(1);
}
