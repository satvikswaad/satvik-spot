# Admin Provisioning Runbook

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Offline Owner-Operated Administrative Provisioning Procedure  

---

## 1. Safety Principles & Execution Rules

1. **Offline Command-Line Execution Only**: The provisioning tool is never exposed as an HTTP route or public API.
2. **Explicit Project ID Required**: Must provide `--project satvik-spot-staging`. Default project ID fallbacks are strictly disabled.
3. **Dry-Run Mode First**: Every provisioning procedure must be validated first using `--dry-run`.
4. **Single Owner Limit**: Supports exactly one initial `admin_owner` account.
5. **No Password Handling**: The provisioning tool manages custom claims only; it never accepts, prints, or stores user passwords.

---

## 2. Step-by-Step Provisioning Procedure

### Step A: Verify Target Firebase UID
Obtain the canonical Firebase Auth UID of the intended owner from Firebase Console or user lookup. Confirm the account is enabled and email is verified.

### Step B: Run Provisioning in Dry-Run Mode
Execute the dry-run command from the repository root:
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json npx ts-node scripts/admin-cli.ts --action grant-owner --uid <TARGET_FIREBASE_UID> --project satvik-spot-staging --dry-run
```
*Expected Output*: Displays proposed custom claims `{ admin: true, role: 'admin_owner', schemaVersion: 1 }` without writing mutations.

### Step C: Execute Provisioning with Confirmation
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json npx ts-node scripts/admin-cli.ts --action grant-owner --uid <TARGET_FIREBASE_UID> --project satvik-spot-staging --confirm
```
*Expected Output*: Grants claims, revokes refresh tokens to force token re-issuance, and writes an audit log record to Firestore `/audit_logs`.

### Step D: Verification
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json npx ts-node scripts/admin-cli.ts --action inspect-admin --uid <TARGET_FIREBASE_UID> --project satvik-spot-staging
```
*Expected Output*: Returns `admin: true` and `role: 'admin_owner'`.

---

## 3. Rollback & Emergency Revocation

To revoke administrative privileges immediately:
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json npx ts-node scripts/admin-cli.ts --action revoke-admin --uid <TARGET_FIREBASE_UID> --project satvik-spot-staging --confirm
```
