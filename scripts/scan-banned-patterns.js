const fs = require('fs');
const path = require('path');

const targetDirs = ['public', 'backend/src', 'shared'];
const extensions = ['.js', '.ts', '.html'];
const ignoreDirs = ['node_modules', 'dist', 'dist-scripts', 'archive', 'build', '.git'];

const BANNED_PATTERNS = [
  { name: 'innerHTML', regex: /\.innerHTML\s*=/g, severity: 'HIGH' },
  { name: 'outerHTML', regex: /\.outerHTML\s*=/g, severity: 'HIGH' },
  { name: 'insertAdjacentHTML', regex: /\.insertAdjacentHTML\s*\(/g, severity: 'HIGH' },
  { name: 'document.write', regex: /document\.write\s*\(/g, severity: 'HIGH' },
  { name: 'eval', regex: /\beval\s*\(/g, severity: 'CRITICAL' },
  { name: 'new Function', regex: /new\s+Function\s*\(/g, severity: 'CRITICAL' },
  { name: 'console.log request body', regex: /console\.log\s*\([^)]*req\.body/g, severity: 'MEDIUM' }
];

function scanDir(dir, results) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (ignoreDirs.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDir(fullPath, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        scanFile(fullPath, results);
      }
    }
  }
}

function scanFile(filePath, results) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(path.resolve(__dirname, '..'), filePath).replace(/\\/g, '/');

  BANNED_PATTERNS.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.regex);
    let count = 0;
    while ((match = regex.exec(content)) !== null) {
      count++;
    }
    if (count > 0) {
      if (!results[pattern.name]) {
        results[pattern.name] = { total: 0, files: {} };
      }
      results[pattern.name].total += count;
      results[pattern.name].files[relPath] = count;
    }
  });
}

const results = {};
targetDirs.forEach(d => scanDir(path.resolve(__dirname, '..', d), results));

console.log('=== FORBIDDEN PATTERN SCAN (AGENT-8) ===');
let grandTotal = 0;
let backendOrSharedTotal = 0;

for (const [name, data] of Object.entries(results)) {
  console.log(`- ${name}: ${data.total} occurrences across ${Object.keys(data.files).length} files`);
  grandTotal += data.total;
  for (const [f, count] of Object.entries(data.files)) {
    if (f.startsWith('backend/') || f.startsWith('shared/')) {
      backendOrSharedTotal += count;
      console.error(`  🚨 FORBIDDEN in backend/shared: ${f} (${count}x)`);
    }
  }
}
console.log(`----------------------------------------`);
console.log(`Total Banned Pattern Hits: ${grandTotal} (backend/shared: ${backendOrSharedTotal})`);

const BASELINE_PUBLIC_MAX = 101;
const enforce = process.argv.includes('--enforce');

if (backendOrSharedTotal > 0) {
  console.error(`❌ AGENT-8 VIOLATION: ${backendOrSharedTotal} forbidden pattern(s) found in backend/src or shared!`);
  process.exit(1);
}

if (enforce && grandTotal > 0) {
  console.error('❌ Enforce mode active: Banned patterns detected in codebase!');
  process.exit(1);
}

if (grandTotal > BASELINE_PUBLIC_MAX) {
  console.error(`❌ REGRESSION: Total banned patterns (${grandTotal}) exceeds baseline maximum (${BASELINE_PUBLIC_MAX})!`);
  process.exit(1);
}

console.log('✅ Forbidden pattern scan passed (0 in backend/shared, within baseline limits).');
process.exit(0);
