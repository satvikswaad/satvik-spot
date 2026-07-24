# Admin Account Recovery Policy

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Owner Identity Recovery & Break-Glass Governance Policy  

---

## 1. Core Recovery Principles

1. **No Backdoor Master Passwords**: No emergency bypass code, master password, or secret answer exists in the codebase or database.
2. **No Unauthenticated Self-Recovery**: Password reset emails alone (`sendPasswordResetEmail`) do not bypass custom claim verification or MFA.
3. **Owner-Operated Re-Grant**: Account recovery and claim restoration require running the offline CLI tool (`scripts/admin-cli.ts`).

---

## 2. Recovery Workflow for Owner Account Loss

In the event that the primary administrator loses access to their account or authentication factor:

1. **Identity Verification**: The repository owner verifies ownership through offline out-of-band communication.
2. **Firebase Auth Password Reset**: The owner triggers an official Firebase Auth password reset link delivered to the verified owner email address.
3. **Session Revocation & Factor Reset**: The repository owner runs:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json npx ts-node scripts/admin-cli.ts --action revoke-sessions --uid <OWNER_UID> --project satvik-spot-staging --confirm
   ```
4. **Re-Enrollment & Audit Verification**: The owner signs in with the new password, completes TOTP MFA re-enrollment, and confirms dashboard access.
