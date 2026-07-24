# Admin MFA Enforcement and Recovery Plan

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Multi-Factor Authentication Architecture & Enrollment Procedures  

---

## 1. Supported MFA Factors & Architecture

- **Primary Factor**: Firebase Authentication Email + Password (`signInWithEmailAndPassword`).
- **Second Factor (MFA)**: TOTP Authenticator App (Google Authenticator / Authy) or SMS verification.
- **Backend Verification**: `verifyAuth.ts` inspects `decoded.firebase?.sign_in_second_factor`. If present, `req.user.mfaVerified` is set to `true`.
- **Enforcement Flag**: `ENABLE_MFA_ENFORCEMENT` in `backend/src/auth/adminMiddleware.ts`.

---

## 2. Owner Setup & Enrollment Instructions (Console Owner Action Item #11)

1. Log into **Firebase Console** -> **Authentication** -> **Settings** -> **Multi-factor authentication**.
2. Enable TOTP / SMS as a supported second factor for `satvik-spot-staging`.
3. Log into the Admin Portal (`public/admin/index.html`) using the owner identity.
4. Complete TOTP enrollment by scanning the QR code with an authenticator app.
5. In `backend/src/auth/adminMiddleware.ts`, ensure `ENABLE_MFA_ENFORCEMENT = true` for live staging/production enforcement.

---

## 3. Recovery Procedure

- If the owner loses access to their MFA device:
  1. The owner uses an offline recovery code generated during initial enrollment.
  2. Alternatively, the repository owner executes `scripts/admin-cli.ts --action revoke-sessions --uid <OWNER_UID>` to force re-authentication and re-enrollment.
- **Bypass Prohibition**: No backdoor secret codes, shared recovery bypass codes, or hardcoded passwords exist in code or database.
