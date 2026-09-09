# Phase 1 — Repository Baseline Inventory

**Date**: July 22, 2026  
**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Target Branch**: `staging`  
**Commit SHA**: `83e85ae1868a9f6407a943cdb439a879d61f7e84`  
**Git Remote**: `origin https://github.com/satvikswaad/satvik-spot.git`  
**Working Tree Status**: Clean  

---

## 1. Active Architecture Mapping

| Component | Target Location | Technology Stack | Hosting / Environment | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Customer Storefront** | `public/site/` | HTML5, CSS3, ES6 JS | Firebase Hosting (`site` target) | **ACTIVE** | `firebase.json` lines 3–5, `scripts/serve-local.js` line 73, `deploy-preflight.ts` line 27 |
| **Admin Portal** | `public/admin/` | HTML5, Vanilla CSS, ES6 JS | Firebase Hosting (`admin` target) | **ACTIVE** | `firebase.json` lines 58–59, `scripts/serve-local.js` line 74, `ADMIN_HOSTING_AND_AUTH_GUIDE.md` |
| **Application Backend** | `backend/` | Node.js 22, Express, TypeScript | Render (`satvik-spot-backend`) | **ACTIVE** | `package.json` line 7 (`build`), `render.yaml`, `backend/src/server.ts` |
| **Database & Auth** | Firebase Cloud Firestore / Auth | Firebase Admin SDK, Web SDK | GCP / Firebase Managed Services | **ACTIVE** | `firestore.rules`, `backend/src/config/firebase.ts` |
| **Emulator Test Suites** | `functions/` | Node.js 22, Jest, TS | Firebase Emulator Suite | **ACTIVE FOR TESTING** | `package.json` line 12 (`test:emulator`), `functions/jest.config.js` |

---

## 2. Directory Inventory & Purpose

### Root Directories
- `public/site/`: Production & staging build files for the customer storefront (HTML, CSS, JS, Assets).
- `public/admin/`: Production & staging build files for the administrative portal (`index.html`, `admin.js`, `firebase-config.js`).
- `backend/`: Authoritative Node.js 22 Express backend service deployed on Render (`src/`, `tests/`, `package.json`, `tsconfig.json`).
- `functions/`: Legacy Cloud Functions codebase retained exclusively for local emulator integration testing (`src/`, `tests/`, `package.json`).
- `scripts/`: Operational CLI scripts (`admin-cli.ts`, `deploy-preflight.ts`, `seed-products.ts`, `serve-local.js`, `backup-emulator.ts`, `restore-emulator.ts`).
- `assets/`: Legacy root assets directory (superceded by `public/site/assets/`).

### Package & Configuration Files
- `package.json`: Workspace root orchestration scripts (`build`, `test`, `test:emulator`, `verify`, `preflight`).
- `package-lock.json`: Root lockfile establishing reproducible dependency tree.
- `backend/package.json` & `backend/package-lock.json`: Render backend service dependencies and build configuration.
- `functions/package.json` & `functions/package-lock.json`: Firebase Functions & emulator testing dependencies.
- `firebase.json`: Hosting targets configuration (`site` -> `public/site`, `admin` -> `public/admin`), headers, security rules, emulator ports.
- `.firebaserc`: Firebase project aliases (`default`: `satwiksweetsandpickels`, `staging`: `satvik-spot-staging`).
- `firestore.rules`: Server-authoritative Firestore Security Rules enforcing default-deny and custom claim role checks.
- `firestore.indexes.json`: Cloud Firestore composite query index definitions.
- `render.yaml`: Render Infrastructure-as-Code deployment blueprint for `satvik-spot-backend`.
- `.env.example`: Safe environment variable template with zero secrets.

---

## 3. Classification of Obsolete & Root-Level Copies

The following root-level HTML, JS, CSS, and asset files are legacy duplicates from early development phases. Active hosting, server scripts, preflight validation, and end-to-end tests consume files strictly from `public/site/` and `public/admin/`:

| Path | File Purpose | Current Status | Replacement Location | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| `index.html` (root) | Legacy customer index | **OBSOLETE** | `public/site/index.html` | `firebase.json` points `hosting:site` to `public/site` |
| `products.html` (root) | Legacy products catalog | **OBSOLETE** | `public/site/products.html` | `firebase.json` points `hosting:site` to `public/site` |
| `our-story.html` (root) | Legacy about page | **OBSOLETE** | `public/site/our-story.html` | `firebase.json` points `hosting:site` to `public/site` |
| `why-us.html` (root) | Legacy features page | **OBSOLETE** | `public/site/why-us.html` | `firebase.json` points `hosting:site` to `public/site` |
| `reviews.html` (root) | Legacy reviews page | **OBSOLETE** | `public/site/reviews.html` | `firebase.json` points `hosting:site` to `public/site` |
| `faq.html` (root) | Legacy FAQ page | **OBSOLETE** | `public/site/faq.html` | `firebase.json` points `hosting:site` to `public/site` |
| `script.js` (root) | Legacy frontend logic | **OBSOLETE** | `public/site/script.js` | `public/site/index.html` loads `./script.js` from `public/site` |
| `style.css` (root) | Legacy storefront styling | **OBSOLETE** | `public/site/style.css` | `public/site/index.html` loads `./style.css` from `public/site` |
| `firebase-config.js` (root)| Legacy root config | **OBSOLETE** | `public/site/firebase-config.js` | `public/site/index.html` loads `./firebase-config.js` |
| `admin-login.html` (root) | 404 stub file | **OBSOLETE** | `public/admin/index.html` | 404 stub content; admin portal lives in `public/admin` |
| `admin-dashboard.html` (root)| 404 stub file | **OBSOLETE** | `public/admin/index.html` | 404 stub content; admin portal lives in `public/admin` |
| `user-login.html` (root) | Legacy auth page | **OBSOLETE** | `public/site/` | Auth flows embedded in customer portal `public/site` |
| `my-orders.html` (root) | Legacy orders page | **OBSOLETE** | `public/site/` | Guest order tracking embedded in `public/site` |
| `robots.txt` (root) | Legacy search directive | **OBSOLETE** | `public/site/robots.txt` | Served from `public/site/robots.txt` |
| `sitemap.xml` (root) | Legacy sitemap | **OBSOLETE** | `public/site/sitemap.xml` | Served from `public/site/sitemap.xml` |
| `assets/` (root) | Legacy root images | **OBSOLETE** | `public/site/assets/` | All images served from `public/site/assets/` |
| `SatvikSwaad_hero_1.jpeg` | Root image copy | **OBSOLETE** | `public/site/assets/` | Image lives in `public/site/assets/` |
| `SatvikSwaad_hero_2.jpeg` | Root image copy | **OBSOLETE** | `public/site/assets/` | Image lives in `public/site/assets/` |
| `WhatsApp Image...` (2 files)| Loose root image copies| **OBSOLETE** | `public/site/assets/` | Image assets belong in `public/site/assets/` |

---

## 4. Ignored & Generated Files Verification

The following items are generated artifacts or local development caches. They are ignored by `.gitignore` and must never be tracked in source control:

- `.firebase/`: Firebase CLI local build and deployment state cache.
- `backend/dist/`: TypeScript compiler output directory for the Render backend.
- `backend/node_modules/`: Local dependencies for Render backend.
- `functions/node_modules/`: Local dependencies for Firebase Functions test runner.
- `node_modules/`: Workspace root local dependencies.
- `firebase_config_temp.json`: Temporary local configuration file generated during manual setup steps.
- `firestore-debug.log` & `functions/firestore-debug.log`: Local Firebase Emulator runtime debug logs.
