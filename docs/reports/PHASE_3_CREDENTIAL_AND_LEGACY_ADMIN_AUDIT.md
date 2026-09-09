# Phase 3 — Credential and Legacy Admin Audit

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Repository-Wide & Git History Credential Audit  

---

## 1. Audit Methodology & Scope

A comprehensive automated and manual inspection of the current working tree and Git commit history was conducted across all files, tests, configurations, scripts, and documentation for:
- Hardcoded administrator emails / passwords
- Default or temporary credentials
- Master passwords, admin secret codes, or backdoor bypasses
- Firebase refresh tokens, ID tokens, or session cookies
- Service-account keys or private keys
- Password hashes or recovery codes

---

## 2. Redacted Credential Audit Findings Table

| Credential Category | Location Searched | Current Tree Status | Git History Status | Live Console Status | Exposure Severity | Required Action | Completion Evidence | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hardcoded Admin Password** | Entire Repository (`public/`, `backend/`, `scripts/`) | **CLEAN** (0 found) | **CLEAN** (0 found) | N/A | None | None | Grep & Git log scan clean | **PASSED** |
| **Master Passwords / Secret Codes** | `backend/src/auth/`, `public/admin/` | **CLEAN** (0 found) | **CLEAN** (0 found) | N/A | None | None | Zero `adminCode` or `masterPassword` | **PASSED** |
| **Firebase Service Account Keys** | Repository root, `backend/`, `functions/` | **CLEAN** (0 found) | **CLEAN** (0 found) | N/A | None | None | `.gitignore` & git ls-files clean | **PASSED** |
| **Firebase Web API Key** | `public/site/firebase-config.js`, `public/admin/firebase-config.js` | Public Firebase Web API Key present (`AIzaSy...`) | Present in history | Live GCP Key | Low (Public Identifiers) | Owner HTTP-referrer restrictions in GCP | Pending Owner Action Item #7 | **PASSED (Local)** / Pending Owner |
| **Test Mock Tokens** | `backend/src/auth/verifyAuth.ts` | Emulator-only mock tokens (`mock_admin_token`) | Present | Local Test Only | Low (Bypasses active ONLY in `NODE_ENV === 'test'`) | Restrict mock token execution strictly to `test` mode | Hardened in Step 4 | **PASSED** |
| **Legacy Admin Provisioning Scripts**| `scripts/admin-cli.ts` | Active CLI script (contained `satwiksweetsandpickels` fallback project ID) | Present | Local Tool | Medium (Fallback project ID risk) | Remove default fallback project ID; enforce single owner limit | Updated in Step 6 | **PASSED** |

---

## 3. Distinction Between Public Firebase Config and Private Credentials

1. **Firebase Public Web Configuration**:
   The values in `public/site/firebase-config.js` (`apiKey`, `authDomain`, `projectId`, `appId`) are standard public Firebase Web SDK parameters intended for browser delivery. They do **not** grant administrative privileges or bypass backend token verification.
2. **Firebase Admin Credentials**:
   Firebase Admin SDK private key JSON files (`service-account.json`) grant full backend administrative privileges. They are strictly excluded from source control (`.gitignore`), zero keys exist in Git history, and backend production loads them safely from `/etc/secrets/firebase-service-account.json`.

---

## 4. Audit Summary Verdict

**VERDICT: CLEAN (Zero active exposed admin passwords or private keys in repo/history)**
