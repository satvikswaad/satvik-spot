const fs = require('fs');
const path = require('path');

const targetDirs = ['backend/src', 'public', 'shared', 'scripts'];
const ignoreDirs = ['node_modules', 'dist', 'dist-scripts', 'archive', 'build', '.git'];

const SECRET_PATTERNS = [
  { name: 'Private Key Block', regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
  { name: 'AWS/R2 Secret Access Key Pattern', regex: /(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)\s*[:=]\s*['"][A-Za-z0-9\/+=]{40}['"]/ },
  { name: 'Razorpay Live Key', regex: /rzp_live_[A-Za-z0-9]{14,}/ },
  { name: 'Production Firebase Token / Service Account Private Key', regex: /"private_key":\s*"-----BEGIN/ },
  { name: 'Hardcoded JWT Secret', regex: /(?:jwtSecret|JWT_SECRET|sessionSecret|SESSION_SECRET)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/ }
];

function scanFile(filePath, hits) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(path.resolve(__dirname, '..'), filePath).replace(/\\/g, '/');

  SECRET_PATTERNS.forEach(pat => {
    if (pat.regex.test(content)) {
      hits.push({ pattern: pat.name, file: relPath });
    }
  });
}

function scanDir(dir, hits) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreDirs.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath, hits);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.json') || entry.name.endsWith('.env'))) {
      scanFile(fullPath, hits);
    }
  }
}

const hits = [];
targetDirs.forEach(d => scanDir(path.resolve(__dirname, '..', d), hits));

console.log('=== SECRET SCAN ===');
if (hits.length > 0) {
  console.error(`❌ Potential secrets detected (${hits.length}):`);
  hits.forEach(h => console.error(`  - ${h.pattern} in ${h.file}`));
  process.exit(1);
} else {
  console.log('✅ Clean: No hardcoded secrets or production credentials detected.');
  process.exit(0);
}
