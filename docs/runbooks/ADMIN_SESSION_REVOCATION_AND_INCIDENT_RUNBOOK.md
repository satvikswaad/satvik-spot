# Admin Session Revocation and Incident Runbook

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Emergency Revocation, Compromise Response & Session Incident Runbook  

---

## 1. Session Revocation Mechanism

- **Revocation Enforcement**: `verifyAuth.ts` invokes `auth.verifyIdToken(token, true)`. Passing `checkRevoked = true` instructs the Firebase Admin SDK to check the revocation status of the user's refresh tokens against Firebase servers on every request.
- **Revocation Trigger**: When `auth.revokeRefreshTokens(uid)` is executed by the CLI tool or owner action, all active refresh tokens for that UID are invalidated immediately.

---

## 2. Emergency Incident Response Procedure (Exact Steps)

1. **Identify Target UID Safely**: Confirm the target Firebase Auth UID of the compromised account.
2. **Disable Account in Firebase Auth**: Disable the account via Firebase Console or CLI (`getUser(uid)` verification).
3. **Execute CLI Refresh Token Revocation**:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json npx ts-node scripts/admin-cli.ts --action revoke-sessions --uid <TARGET_UID> --project satvik-spot-staging --confirm
   ```
4. **Revoke Administrative Custom Claims**:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json npx ts-node scripts/admin-cli.ts --action revoke-admin --uid <TARGET_UID> --project satvik-spot-staging --confirm
   ```
5. **Inspect Audit Logs**: View `/audit_logs` in Firestore to verify all recent actions performed during the suspect timeframe.
6. **Re-Enable Account & Reset Credentials**: Once identity is confirmed and MFA is reset, re-grant `grant-owner` claims using the runbook procedure.
