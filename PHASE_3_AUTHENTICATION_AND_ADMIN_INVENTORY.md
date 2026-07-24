# Phase 3 — Authentication and Admin Inventory

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Comprehensive Inventory of All Authentication & Admin Paths  

---

## 1. Authentication and Admin Asset Inventory Table

| Component | Active Path | Purpose | Identity Source | Authorization Source | Credential Storage | Session Mechanism | Environment | Status | Evidence | Risk | Required Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Customer Portal JS** | `public/site/script.js` | Storefront UX & guest catalog | Optional Firebase Auth | None (Public view) | In-Memory / Firebase Auth | Local / Session Storage | Staging / Local | Active | Lines 1-350 | None | Maintain customer isolation |
| **Admin Portal UI** | `public/admin/index.html` | Admin login & dashboard interface | Firebase Auth | Verified Backend Token | In-Memory Auth State | Firebase Auth SDK Token | Staging / Local | Active | Lines 1-120 | Unverified local render risk | Require backend authorization check before rendering |
| **Admin Portal JS** | `public/admin/admin.js` | Admin Auth & Dashboard API calls | Firebase Auth (`signInWithEmailAndPassword`) | Firebase ID Token (`Bearer`) | Firebase Auth SDK | Short-Lived ID Token | Staging / Local | Active | Lines 1-210 | Cached UI state | Clear memory & localStorage on 401/403 |
| **Auth Middleware** | `backend/src/auth/verifyAuth.ts` | Bearer token verification & revocation check | Firebase Auth (`auth.verifyIdToken(token, true)`) | Token Custom Claims (`decoded.admin`) | Server-side Firebase Admin SDK | Short-Lived ID Token (1h max) | Server (Render) | Active | Lines 1-95 | Mock token fallback in tests | Restrict mock tokens to test mode only |
| **Admin Authorization**| `backend/src/auth/adminMiddleware.ts` | Admin claim & role verification | Verified Token (`req.user`) | Custom Claim (`admin: true`, `role: 'admin_owner'`) | Server-side verification | Short-Lived ID Token | Server (Render) | Active | Lines 1-46 | Missing `auth_time` recent-login check | Add `requireRecentAuthentication` & explicit role check |
| **Admin Provisioning CLI**| `scripts/admin-cli.ts` | Local/owner CLI to assign claims & revoke sessions | Firebase Auth UID | Firebase Admin SDK | Local Service Account Key (`GOOGLE_APPLICATION_CREDENTIALS`) | Refresh token revocation | Local / Owner CLI | Active | Lines 1-177 | Legacy project ID default fallback | Remove default project ID fallback & enforce single owner limit |
| **Admin Controller** | `backend/src/admin/adminController.ts` | Product CRUD & audit API handlers | Verified Token (`req.user`) | Backend `requireAdmin` middleware | Cloud Firestore | Short-Lived ID Token | Server (Render) | Active | Lines 1-150 | None | Ensure all endpoints use `requireAdmin` |
| **Firestore Security Rules** | `firestore.rules` | Database access control rules | Firebase Auth UID | Token Claims (`request.auth.token.admin == true`) | GCP Managed Firestore | Client SDK Token | GCP Managed | Active | Lines 1-150 | Direct client write attempts | Maintain default-deny fallback |

---

## 2. Core Security Question Responses

1. **How does a customer authenticate?**  
   Customers authenticate optionally via Firebase Authentication (`public/site/script.js` using Firebase Auth Web SDK). Customer tokens contain zero administrative claims (`admin: false`).

2. **How does an administrator authenticate?**  
   Administrators authenticate exclusively on the dedicated admin portal (`public/admin/index.html` & `public/admin/admin.js`) using Firebase Authentication (`signInWithEmailAndPassword`). Backend endpoints verify the short-lived Bearer ID token cryptographically using Firebase Admin SDK with session revocation checking (`auth.verifyIdToken(token, true)`).

3. **Where is admin authority established?**  
   Administrative authority is established **strictly on the server** via Firebase Auth Custom Claims (`{ admin: true, role: 'admin_owner', schemaVersion: 1 }`), assigned exclusively through the offline, owner-operated CLI tool (`scripts/admin-cli.ts`).

4. **Can any client assign its own role?**  
   **NO**. Client SDKs have zero access to assign or alter custom claims. Firestore Security Rules deny client SDK writes to `admin`, `audit_logs`, and user claims.

5. **Are any admin credentials present in source, configuration, fixtures, history or documentation?**  
   **NO**. Scanned all source files, configuration files, and Git commit history (`git log -S`). Zero passwords, secret keys, or real admin credentials exist in the repository.

6. **Are there multiple administrator accounts or role systems?**  
   **NO**. The system enforces a single owner-level administrator identity (`admin_owner`). Generic or multi-tenant admin roles are rejected.

7. **Can customer authentication state reach the admin portal?**  
   **NO**. Customer and admin portals run on separate Firebase Hosting targets (`site` vs `admin`). If a customer logs into the admin portal, the backend API rejects their token with HTTP `403 Forbidden` because their token lacks `admin: true` claims.

8. **Does every admin API independently verify authentication and authorization?**  
   **YES**. Every administrative endpoint in `backend/src/app.ts` is explicitly protected by `verifyAuth` and `requireAdmin` middleware.

9. **Are deleted, disabled or revoked users rejected?**  
   **YES**. `verifyIdToken(token, true)` checks revocation status with Firebase Authentication servers on every request. Disabled or revoked tokens return 401/403.

10. **Is MFA implemented and genuinely enforced?**  
    MFA token evidence checking (`sign_in_second_factor`) is implemented in `verifyAuth.ts`. Live TOTP enrollment enforcement requires owner configuration in Google Cloud Console / Firebase Console and is documented in the Phase 3 Runbook.

11. **Does a provisioning mechanism already exist?**  
    **YES**. `scripts/admin-cli.ts` provides a local, offline command-line tool using the Firebase Admin SDK.

12. **Is any admin login linked from the customer portal?**  
    **NO**. Scanned `public/site/index.html` and `public/site/script.js`. Zero links to `admin`, `admin-login`, or administrative routes exist in the customer storefront.
