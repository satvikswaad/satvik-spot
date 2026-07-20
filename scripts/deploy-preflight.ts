import * as fs from 'fs';
import * as path from 'path';

/**
 * Deployment Preflight Validation Script
 * Verifies all security, configuration, and environment separation rules before release.
 */
function runPreflight() {
  console.log('====================================================');
  console.log('      SATWIK SPOT — DEPLOYMENT PREFLIGHT VALIDATION   ');
  console.log('====================================================');

  const errors: string[] = [];
  const rootDir = process.cwd();

  // 1. Verify Node.js 22 Runtime
  const functionsPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'functions/package.json'), 'utf8'));
  if (functionsPkg.engines?.node !== '22') {
    errors.push('Functions package.json must target Node.js 22');
  }

  // 2. Verify Dual Hosting Target Configuration
  const firebaseJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'firebase.json'), 'utf8'));
  if (!Array.isArray(firebaseJson.hosting) || firebaseJson.hosting.length !== 2) {
    errors.push('firebase.json must configure dual hosting targets (site & admin)');
  } else {
    if (firebaseJson.hosting[0].public !== 'public/site') {
      errors.push("Hosting target 'site' must point to 'public/site'");
    }
    if (firebaseJson.hosting[1].public !== 'public/admin') {
      errors.push("Hosting target 'admin' must point to 'public/admin'");
    }
  }

  // 3. Verify Absence of Service Account Files & Secrets
  if (fs.existsSync(path.join(rootDir, 'service-account.json'))) {
    errors.push('CRITICAL SECURITY FAIL: service-account.json file detected in repository!');
  }

  // 4. Verify Absence of Hardcoded Plaintext Admin Credentials
  const indexHtml = fs.readFileSync(path.join(rootDir, 'public/site/index.html'), 'utf8');
  if (indexHtml.includes('admin-login.html') || indexHtml.includes('satvik123')) {
    errors.push('CRITICAL SECURITY FAIL: Admin links or hardcoded passwords detected in public storefront!');
  }

  // 5. Verify Content Security Policy (No unsafe-eval)
  const cspHeader = firebaseJson.hosting[0].headers[0].headers.find((h: any) => h.key === 'Content-Security-Policy')?.value;
  if (!cspHeader || cspHeader.includes("'unsafe-eval'")) {
    errors.push("CRITICAL SECURITY FAIL: CSP is missing or contains forbidden 'unsafe-eval'");
  }

  if (errors.length > 0) {
    console.error('❌ PREFLIGHT VALIDATION FAILED WITH ERRORS:');
    errors.forEach(err => console.error(`   - ${err}`));
    process.exit(1);
  }

  console.log('✅ ALL DEPLOYMENT PREFLIGHT CHECKS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runPreflight();
