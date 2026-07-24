# Render Single Backend Enforcement Report

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Backend Target**: Render (`satvik-spot-backend`)  

---

## 1. Single Application Backend Verification

Render is confirmed as the **sole active application backend** for Satwik Sweets and Pickels. The legacy Firebase Functions codebase (`functions/`) has been decoupled from live deployment targets and retained strictly as a non-deployable local emulator test harness.

| Inspection Check | Config / File Path | Target State | Verified Status | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Firebase Deployment Block** | `firebase.json` | No `"functions"` key | **VERIFIED** | `"functions"` key removed from `firebase.json` |
| **Hosting API Rewrites** | `firebase.json` | Only SPA `/index.html` rewrites | **VERIFIED** | Lines 50–54 & 104–108 target `/index.html` only |
| **Frontend Endpoint URLs** | `public/site/` & `public/admin/` | Zero `cloudfunctions.net` links | **VERIFIED** | Scanned all JS/HTML files for Functions URLs |
| **CI Deployment Scripts** | `.github/workflows/security-ci.yml` | Zero Functions deploy steps | **VERIFIED** | CI workflow runs backend tests & build only |
| **Render Blueprint** | `render.yaml` | Node.js 22 service definition | **VERIFIED** | Declares `satvik-spot-backend` web service |

---

## 2. Safe Retirement & Test Harness Procedure

1. **Local Emulator Retained**: The `functions/` directory remains on disk solely to support Jest emulator tests (`npm run test:emulator`).
2. **Deploy Safety Guard**: Running `firebase deploy` or `firebase deploy --only hosting` will strictly upload static assets from `public/site` and `public/admin` without triggering Cloud Function builds.
3. **Automated Assertion**: Added Jest test suite `backend/tests/phase2Architecture.spec.ts` asserting that `firebase.json` never gains a `"functions"` key and frontend assets never reference Cloud Functions endpoints.
