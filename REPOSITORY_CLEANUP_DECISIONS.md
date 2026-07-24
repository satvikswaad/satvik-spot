# Repository Cleanup Decisions & Evidence

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Classification and removal of obsolete root-level files and deployment configuration boundaries.  

---

## 1. Classification & Action Matrix

| Candidate Path | Category | Proposed Action | Replacement Location | Reference Check & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| `index.html` (root) | Obsolete Copy | **REMOVE** | `public/site/index.html` | Served via `public/site`. `firebase.json` points `hosting:site` to `public/site`. |
| `products.html` (root) | Obsolete Copy | **REMOVE** | `public/site/products.html` | Served via `public/site`. Zero script references. |
| `our-story.html` (root)| Obsolete Copy | **REMOVE** | `public/site/our-story.html` | Served via `public/site`. Zero script references. |
| `why-us.html` (root) | Obsolete Copy | **REMOVE** | `public/site/why-us.html` | Served via `public/site`. Zero script references. |
| `reviews.html` (root) | Obsolete Copy | **REMOVE** | `public/site/reviews.html` | Served via `public/site`. Zero script references. |
| `faq.html` (root) | Obsolete Copy | **REMOVE** | `public/site/faq.html` | Served via `public/site`. Zero script references. |
| `admin-login.html` | 404 Stub | **REMOVE** | `public/admin/index.html` | Admin portal served exclusively via `public/admin`. |
| `admin-dashboard.html`| 404 Stub | **REMOVE** | `public/admin/index.html` | Admin portal served exclusively via `public/admin`. |
| `user-login.html` | Obsolete Flow | **REMOVE** | `public/site/` | Customer authentication integrated into `public/site`. |
| `my-orders.html` | Obsolete Flow | **REMOVE** | `public/site/` | Guest order tracking integrated into `public/site`. |
| `script.js` (root) | Obsolete Copy | **REMOVE** | `public/site/script.js` | Storefront script loaded from `./script.js` within `public/site/`. |
| `style.css` (root) | Obsolete Copy | **REMOVE** | `public/site/style.css` | Storefront CSS loaded from `./style.css` within `public/site/`. |
| `firebase-config.js` (root)| Obsolete Copy| **REMOVE** | `public/site/firebase-config.js` | Config loaded from `./firebase-config.js` within `public/site/`. |
| `robots.txt` (root) | Obsolete Copy | **REMOVE** | `public/site/robots.txt` | Served via `public/site`. |
| `sitemap.xml` (root) | Obsolete Copy | **REMOVE** | `public/site/sitemap.xml` | Served via `public/site`. |
| `assets/` (root) | Obsolete Copy | **REMOVE** | `public/site/assets/` | Image assets served exclusively from `public/site/assets/`. |
| `SatvikSwaad_hero_1.jpeg`| Root Copy | **REMOVE** | `public/site/assets/` | Image lives in `public/site/assets/`. |
| `SatvikSwaad_hero_2.jpeg`| Root Copy | **REMOVE** | `public/site/assets/` | Image lives in `public/site/assets/`. |
| `WhatsApp Image...` (2 files)| Loose Root Copies| **REMOVE**| `public/site/assets/` | Image assets belong in `public/site/assets/`. |
| `firebase_config_temp.json`| Temp Dev File| **KEEP IGNORED**| N/A | Local temp file. Ignored in `.gitignore`. |
| `functions/` (dir) | Test Harness | **RETAIN FOR TESTS**| N/A | Retained exclusively for local emulator test suites (`test:emulator`). Removed from `firebase.json` deployment target to prevent Cloud Function deployments. |

---

## 2. Firebase Functions Retirement Procedure

1. **Backend Decoupling**: Render is established as the sole application backend (`backend/`).
2. **Deployment Safety**: The `"functions"` block is removed from `firebase.json` so that `firebase deploy` and `firebase deploy --only hosting` will never deploy Functions to GCP.
3. **Local Testing Preservation**: The `functions/` directory is retained locally to support Jest integration tests against the Firebase Emulator (`npm run test:emulator`).

---

## 3. Rollback Instructions

If any removed root file needs to be restored, execute:
```bash
git checkout HEAD -- <file-path>
```
Or to restore all removed files:
```bash
git checkout HEAD -- .
```
