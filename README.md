# Satvik Swaad — Engineering & Storefront Platform

[![Node.js Version](https://img.shields.io/badge/node-22.x-brightgreen.svg)](package.json)
[![Platform](https://img.shields.io/badge/platform-Firebase%20%7C%20Render-orange.svg)](firebase.json)
[![Security Hardened](https://img.shields.io/badge/security-OWASP%20ZAP%20Compliant-blue.svg)](docs/security/)
[![Mobile Responsive](https://img.shields.io/badge/mobile-360px%20--%20430px%20Certified-success.svg)](tests/e2e/)

> **"Maa ke swaad ki virasat"** — Authentic Indian Homemade Sweets, Pickles & Wellness Preserves.

This repository houses the complete end-to-end production platform for **Satvik Swaad** (`satvik-spot`), featuring a high-performance customer storefront, secure back-office admin portal, Render Express/TypeScript API backend, and Firebase serverless functions.

---

## 🏛️ System Architecture

The codebase follows a modular multi-surface architecture:

```
                               ┌────────────────────────────────┐
                               │     Customer Web Browser       │
                               │  (Mobile 360-430px & Desktop)  │
                               └───────────────┬────────────────┘
                                               │ HTTP / HTTPS
                                               ▼
┌─────────────────────────┐       ┌─────────────────────────────┐       ┌──────────────────────────┐
│   Admin Portal (Back-Office)  │  ◄────► │  Firebase Hosting & Rules   │ ◄────►│   Customer Storefront    │
│     (public/admin/)     │       │     (public/site/)          │       │     (public/site/)       │
└────────────┬────────────┘       └──────────────┬──────────────┘       └────────────┬─────────────┘
             │                                   │                                   │
             │ Secure Token Auth                 │ Firebase Client SDK               │ REST / Webhook
             ▼                                   ▼                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             Render API Backend (backend/src/)                                    │
│                 Express + TypeScript · Razorpay Gateway · Order State Machine                    │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │
                                                 ▼
                               ┌────────────────────────────────┐
                               │  Google Cloud / Firestore DB   │
                               │  (Rules & Index Boundaries)    │
                               └────────────────────────────────┘
```

---

## 📁 Repository Structure

```text
SatvikSwad/
├── README.md                           # Master repository documentation (this file)
├── package.json                        # Root package scripts, test runners, devDependencies
├── firebase.json                       # Firebase Hosting targets, CSP headers, emulator ports
├── firestore.rules                     # Production Firestore cryptographic security rules
├── firestore.indexes.json              # Composite index declarations for query optimization
├── render.yaml                         # Production Render backend deployment blueprint
├── .env.example                        # Environment variables template
├── .gitignore                          # Standardized clean VCS exclusions
│
├── backend/                            # Express / TypeScript backend microservice
│   ├── src/                            # Controllers, middleware, database adapters, routes
│   ├── tests/                          # Backend unit, integration & payment tests
│   └── dist/                           # Compiled production JavaScript output
│
├── functions/                          # Firebase Cloud Functions (serverless event handlers)
│   ├── src/                            # Trigger functions, marketplace webhook handlers
│   └── tests/                          # Firestore security rules and integration test suite
│
├── public/                             # Static frontend deployment targets
│   ├── site/                           # Customer Storefront (HTML5, Vanilla JS, CSS3, assets)
│   └── admin/                          # Secure Admin Portal (protected orders, inventory, auth)
│
├── build/                              # Frontend bundling & asset build scripts
├── dist-scripts/                       # Compiled distribution helper scripts
│
├── docs/                               # Centralized project documentation hub
│   ├── architecture/                   # System design, DB schema, marketplace adapter specs
│   ├── security/                       # Threat models, access matrices, CSP & CORS standards
│   ├── reports/                        # Milestone reports, Lighthouse audits, verification logs
│   ├── runbooks/                       # Deployment preflights, staging guides, admin runbooks
│   ├── compliance/                     # Legal policies (privacy, terms, refund, food safety)
│   ├── design/                         # Design system, style guide, UI options & mockups
│   │   ├── reference-pics/             # Reference mockups & original design guidance
│   │   └── screenshots/                # Certified device verification captures
│   ├── PROJECT_BRAIN.md                # System context, core boundaries & architectural rules
│   └── CHANGELOG.md                    # Historical record of all version iterations
│
├── scripts/                            # Operational & database management scripts
│   ├── serve-local.js                  # Dual-port local HTTP server (site: 5000/8000, admin: 5001)
│   ├── seed-products.ts                # Production & emulator product catalog seeder
│   ├── backup-emulator.ts              # Local emulator state snapshot tool
│   ├── restore-emulator.ts             # Local emulator state recovery tool
│   ├── deploy-preflight.ts             # Pre-release validation & integrity checks
│   └── legacy-migrations/              # Preserved one-off migration and patch scripts
│
├── tests/                              # Global test & verification suites
│   ├── e2e/                            # Headless browser responsive tests (360px - 430px)
│   └── security/                       # OWASP ZAP baseline scanner configs and scripts
│
└── archive/                            # Preserved legacy backups and historical reference
    ├── legacy-admin/                   # Pre-hardening admin portal snapshot (superseded)
    ├── backups/                        # Historical repository snapshots and archives
    └── ref-source/                     # External reference implementations
```

---

## 🚀 Quickstart & Local Development

### 1. Prerequisites
- **Node.js**: v22.x or v24.x
- **npm**: v10+
- **Firebase CLI** *(optional, for local emulators)*: `npm install -g firebase-tools`

### 2. Install Dependencies
```bash
npm install
cd backend && npm install && cd ..
```

### 3. Start Local Servers
Run the integrated multi-portal server:
```bash
npm run start:local
```
This serves:
- 🛒 **Customer Storefront**: [http://localhost:5000](http://localhost:5000) (and [http://localhost:8000](http://localhost:8000))
- 🛡️ **Admin Portal**: [http://localhost:5001](http://localhost:5001)

### 4. Build Frontend & Backend
```bash
# Build backend
npm run build

# Build and optimize frontend assets
npm run build:frontend
```

---

## 🧪 Testing & Verification

| Command | Description |
| :--- | :--- |
| `npm run test:devices` | Runs headless CDP emulation across 360px, 375px, 390px, 430px mobile viewports |
| `npm run test:backend` | Executes Jest unit & integration test suites in `backend/` |
| `npm run test:rules` | Validates `firestore.rules` against local Firebase emulators |
| `npm run test:security` | Runs security gate test assertions |
| `npm run verify` | Full pre-commit check (typecheck, backend tests, emulators, preflight) |

---

## 📚 Documentation Directory Map

- **System Architecture & Database**: [`docs/architecture/`](docs/architecture/)
  - [`SYSTEM_ARCHITECTURE.md`](docs/architecture/SYSTEM_ARCHITECTURE.md)
  - [`DATABASE_SCHEMA.md`](docs/architecture/DATABASE_SCHEMA.md)
  - [`MARKETPLACE_ARCHITECTURE.md`](docs/architecture/MARKETPLACE_ARCHITECTURE.md)
- **Security & Authorization**: [`docs/security/`](docs/security/)
  - [`SECURITY_THREAT_MODEL.md`](docs/security/SECURITY_THREAT_MODEL.md)
  - [`CSP_AND_SECURITY_HEADERS.md`](docs/security/CSP_AND_SECURITY_HEADERS.md)
  - [`ADMIN_PERMISSION_MATRIX.md`](docs/security/ADMIN_PERMISSION_MATRIX.md)
- **Runbooks & Operations**: [`docs/runbooks/`](docs/runbooks/)
  - [`ADMIN_PROVISIONING_RUNBOOK.md`](docs/runbooks/ADMIN_PROVISIONING_RUNBOOK.md)
  - [`RENDER_STAGING_DEPLOYMENT_GUIDE.md`](docs/runbooks/RENDER_STAGING_DEPLOYMENT_GUIDE.md)
  - [`DEPLOYMENT_PREFLIGHT.md`](docs/runbooks/DEPLOYMENT_PREFLIGHT.md)
- **Legal & Regulatory Compliance**: [`docs/compliance/`](docs/compliance/)
  - [`FOOD_COMPLIANCE_MATRIX.md`](docs/compliance/FOOD_COMPLIANCE_MATRIX.md)
  - [`PRIVACY_POLICY_DATA_FLOW_AUDIT.md`](docs/compliance/PRIVACY_POLICY_DATA_FLOW_AUDIT.md)
- **Design System & Assets**: [`docs/design/`](docs/design/)
  - [`DESIGN_SYSTEM.md`](docs/design/DESIGN_SYSTEM.md)
  - [`reference-pics/`](docs/design/reference-pics/)

---

## 📄 License & Ownership
Copyright © 2026 Satvik Swaad. All rights reserved. Private and confidential proprietary source code.
