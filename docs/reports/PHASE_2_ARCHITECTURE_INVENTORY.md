# Phase 2 — Architecture Inventory

**Date**: July 22, 2026  
**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Target Tier**: Staging (`satvik-spot-staging`)  
**Repository Branch**: `staging`  

---

## 1. Active Architecture Component Inventory

| Component Name | Active Source Path | Runtime Platform | Target Environment | Public Endpoint | Trust Level | Auth Boundary | Data Accessed | Deployment Method | Active / Test-Only Status | Evidence | Residual Risk / Ambiguity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Customer Storefront** | `public/site/` | Firebase Hosting | Staging / Local | `https://satvik-spot-staging.web.app` | Untrusted Client | Public / Session Auth | Product catalog, public reviews, guest orders | `firebase deploy --only hosting:site` | **ACTIVE** | `firebase.json` lines 3–5, `scripts/serve-local.js` | Browser caching may briefly hold old bundle |
| **Admin Portal** | `public/admin/` | Firebase Hosting | Staging / Local | `https://satvik-spot-staging-admin.web.app` | Semi-Trusted Client | Firebase Auth + `admin: true` Custom Claim | Orders, inventory, messages, audit logs | `firebase deploy --only hosting:admin` | **ACTIVE** | `firebase.json` lines 58–59, `ADMIN_HOSTING_AND_AUTH_GUIDE.md` | Known admin portal URL is not a security boundary |
| **Application API Backend** | `backend/` | Render (Node.js 22 + Express + TS) | Staging / Local | `https://satvik-spot-backend-staging.onrender.com` | Trusted Application Server | Bearer Firebase ID Token + Admin Claim Middleware | Cloud Firestore (Full Admin SDK write access) | Render Service Git Trigger / Manual Trigger | **ACTIVE (SOLE API BACKEND)** | `render.yaml`, `backend/src/server.ts`, `backend/src/app.ts` | Cold start latency on Render free/starter tiers |
| **Database & Security Rules** | Root `firestore.rules` | Cloud Firestore | Staging / Local Emulator | Managed Service | Managed Trusted Storage | Server-Authoritative Rules (Default Deny) | All system collections | `firebase deploy --only firestore:rules` | **ACTIVE** | `firestore.rules`, `firebase.json` | Rules bypassable by Admin SDK on backend (by design) |
| **Emulator Test Harness** | `functions/` | Firebase Emulator Suite | Local Integration Test | `http://127.0.0.1:5001` (Local) | Untrusted Test Environment | Local Auth Emulator | Local Firestore Emulator Data | **NON-DEPLOYABLE (Test Only)** | **TEST HARNESS ONLY** | `package.json` line 12 (`test:emulator`), `firebase.json` (functions deploy target removed) | Must never be re-added to `firebase.json` |

---

## 2. Explicit Architectural Confirmations

1. **Customer Portal Location**: `public/site/` is the active customer storefront target (`hosting:site`).
2. **Admin Portal Location**: `public/admin/` is the separate active administrative target (`hosting:admin`).
3. **Application API Backend**: `backend/` is the **only** deployable application backend hosted on Render.
4. **Firebase Functions Status**: **Not deployed**. The top-level `"functions"` block has been removed from `firebase.json`. The `functions/` folder is retained strictly as a non-deployable test harness for Jest emulator tests (`npm run test:emulator`).
5. **Obsolete API Endpoints**: Zero active frontend assets or scripts reference legacy Cloud Functions HTTP triggers.
6. **Shared Render API**: Both customer and admin portals communicate exclusively with the single backend instance on Render (`satvik-spot-backend`).
7. **Environment Separation**: Staging project (`satvik-spot-staging`) and production project (`satwiksweetsandpickels`) are strictly separated in `.firebaserc`.
8. **Production Readiness**: Production deployment is **NOT authorized** and zero production credentials exist in the codebase.
9. **Local Development Mode**: Local development uses explicit `NODE_ENV=development` with ports `5000` (site), `5001` (admin), `8080` (backend), `9099` (auth emulator), and `4000` (emulator UI).
