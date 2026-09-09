# ADMIN INCIDENT AND RECOVERY GUIDE

**System**: Satwik Sweets and Pickels  
**Scope**: Emergency Response, Compromised Account Revocation, Incident Recovery & Audit Procedures  
**Date**: July 19, 2026  

---

## 1. Incident Scenario 1: Compromised Administrator Account

If an administrator's credentials or device are compromised:

### Immediate Action Plan:
1. **Revoke Admin Custom Claims**:
   ```bash
   npx ts-node scripts/admin-cli.ts --action revoke-admin --uid <compromisedUid> --confirm
   ```
2. **Revoke All Active User Sessions**:
   ```bash
   npx ts-node scripts/admin-cli.ts --action revoke-sessions --uid <compromisedUid> --confirm
   ```
   This immediately invalidates all active refresh tokens and prevents the account from generating new ID tokens.

3. **Disable Firebase Auth Account**:
   Disable account in Firebase Console or via Firebase CLI.

---

## 2. Incident Scenario 2: Emergency Super-Admin Provisioning

If all primary administrator accounts are locked out:

1. **Verify Offline Environment**: Ensure local CLI machine is authorized and has access to local service account credentials or emulator environment.
2. **Execute Provisioning Command**:
   ```bash
   npx ts-node scripts/admin-cli.ts --action grant-admin --uid <emergencyAdminUid> --confirm
   ```
3. **Inspect Active Claims**:
   ```bash
   npx ts-node scripts/admin-cli.ts --action inspect-admin --uid <emergencyAdminUid>
   ```

---

## 3. Incident Scenario 3: Audit Trail Investigation

In the event of suspicious administrative actions:
1. Query append-only Firestore collection `/audit_logs` using Firebase Console or Admin SDK.
2. Filter entries by `action == 'ADMIN_GRANTED'`, `'ADMIN_REVOKED'`, or `'SESSIONS_REVOKED'`.
3. Inspect `actorUid`, `timestamp`, and `ip` fields to trace the origin of administrative commands.

---
*End of Admin Incident and Recovery Guide.*
