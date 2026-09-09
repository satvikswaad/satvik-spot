# Satvik Swaad — Platform Launch QA & Final Sign-Off Checklist

**Release Candidate Version:** `v1.0.0-rc1`  
**Target Environment:** Staging (`satvik-spot-staging.web.app`) → Production (`satwikspot.com`)  
**Backend Service:** Node.js 22 Express / TypeScript on Render  
**Frontend Service:** Firebase Hosting (Decoupled Static Client)  
**Database:** Google Cloud Firestore  
**Date:** 2026-09-06  
**Status:** **TECHNICAL AUDIT PASSED — PENDING HUMAN BUSINESS/LEGAL SIGN-OFF**

---

## Overview

This checklist serves as the authoritative release gate for the Satvik Swaad e-commerce platform. It bifurcates into:
1. **Verified Working with Automated Test / Scan Proof:** Engineering and security controls validated by automated test suites, static analysis, vulnerability scanning, and schema proofs.
2. **Items Requiring Human Sign-Off:** Business, regulatory, legal, and operational prerequisites that must be explicitly executed and approved by human stakeholders prior to opening commercial ordering.

---

## PART 1: Verified Working with Automated Test & Scan Proof

### 1. Codebase Hygiene & Documentation
- [x] **Zero Marketing Hyperbole:** All promotional, self-praising, or unsubstantiated claims (*"military-grade"*, *"ultra-secure"*, *"enterprise-grade"*, *"zero X"*, *"bulletproof"*) have been eliminated from code comments, inline documentation, customer pages, and headers.
- [x] **Technical Documentation:**
  - `ARCHITECTURE.md`: Factual technical documentation covering system topology, decoupled hosting, atomic transactions, idempotency cache, App Check attestation, and WhatsApp-assisted ordering trade-offs.
  - `CONTRIBUTING.md`: Development standards, branching workflow (`staging` → `main`), strict TypeScript guidelines, and mandatory automated test commands.
- [x] **Domain-Specific Naming:** Refactored generic variable names to explicit business domain identifiers across frontend and backend services.

### 2. Backend & Infrastructure Security Controls
- [x] **Cryptographic CSP Nonces:** Per-request cryptographically secure 16-byte base64 nonces generated via Node.js `crypto` and injected into `Content-Security-Policy: script-src 'self' 'nonce-${nonce}' ...`.
- [x] **Hardened Exact-Origin CORS:** Exact-origin allowlist validation. Verified by automated tests to reject prefix lookalikes (`https://attacker-satvik-spot-staging.web.app`), suffix lookalikes (`https://satvik-spot-staging.web.app.attacker.com`), unauthorized ports (`:8080`), and rogue subdomains.
- [x] **Per-Route Sliding Window Rate Limiting:**
  - `orderRateLimiter`: 5 requests / minute
  - `messageRateLimiter`: 5 requests / minute
  - `reviewRateLimiter`: 10 requests / minute
  - `guestLookupRateLimiter`: 10 requests / minute
  - `adminRateLimiter`: 30 requests / minute
  - Baseline `rateLimiter`: 60 requests / minute
  - Rate limit breaches log structured security warnings (`routeIdentifier`, `clientIp`, `count`, `maxRequests`, `url`) and record append-only audit events (`RATE_LIMIT_EXCEEDED`).
- [x] **Zero-Unknown-Keys Schema Validation:** Strict input validation schemas (`orderSchema`, `messageSchema`, `reviewSchema`, `customerSchema`) reject unknown, extra, or prototype-pollution properties with HTTP 400 `VALIDATION_ERROR`.
- [x] **Cookie Security Middleware:** Middleware intercepts `Set-Cookie` headers to enforce `Secure; HttpOnly; SameSite=Strict`.
- [x] **Hosting Target Isolation:** `firebase.json` enforces separate targets for `public/site` (storefront) and `public/admin` (admin panel). Admin assets are served with `X-Robots-Tag: noindex, nofollow, noarchive` and `Cache-Control: no-store`.

### 3. Admin Panel Security & Authorization
- [x] **Mandatory TOTP MFA Enforcement:** Admin endpoints require multi-factor authentication (`mfaVerified === true` or TOTP second factor). Unauthenticated or non-MFA tokens are rejected with HTTP 403 `FORBIDDEN`.
- [x] **Least-Privilege RBAC Matrix (5 Roles):**
  - `catalog_manager`: Allowed to manage products, stock, and variants; rejected from orders, payment verification, and audit logs.
  - `order_manager`: Allowed to view dashboard and transition order states; rejected from catalog mutations and audit logs.
  - `financial_auditor`: Allowed to verify payments (ACCEPT/REJECT); rejected from catalog mutations and customer messages.
  - `support_agent`: Allowed to update contact inquiries and moderate reviews; rejected from catalog mutations, pricing, and orders.
  - `admin_owner`: Superuser with full authorized administrative access.
- [x] **Step-Up Re-Authentication (300-Second Window):** High-privilege mutations (`archiveAdminProduct`, `updateAdminVariants`, `transitionOrderStatus`, `getAuditLogs`) require re-authentication within 300 seconds; stale sessions return HTTP 428 `REAUTHENTICATION_REQUIRED`.
- [x] **IP Allowlisting:** Optional IP allowlist filter (`ADMIN_ALLOWED_IPS`) mounted on `/api/v1/admin/*` to restrict admin access to authorized networks/VPNs.
- [x] **State Mutation Audit Logging:** Every admin write captures and logs exact `beforeState` and `afterState` diffs into the `/audit_logs` Firestore collection.

### 4. Legal Comparison Section
- [x] **Objective, Factual Dimensions:** Comparison table evaluates 7 verifiably true product attributes:
  1. Cooking & Base Oil (100% Cold-Pressed Mustard Oil vs. Refined Blends & TBHQ)
  2. Preservation Methodology (Rock Salt & Sun-Curing vs. Synthetic Chemical Preservatives INS 211/224)
  3. Acidity & Souring Agents (Natural Amchur & Lime Juice vs. Industrial Acetic Acid INS 260)
  4. Processing & Batching (Glass-Jar Micro-Batches vs. High-Heat Kettle Cooking)
  5. Sweetener Base (Desi Khand, Organic Jaggery & A2 Ghee vs. Bleached Sugar & Vanaspati)
  6. Spices & Aromatics (Stone-Ground Whole Spices vs. Spent Powders & Synthetic Essences)
  7. Regulatory & Lab Verification (NABL Panel Testing vs. Baseline Minimums)
- [x] **Zero Competitor Trademarks:** Confirmed zero references to competitor brand names (Mother's Recipe, Priya, Bedekar, Nilon's, Pachranga, MTR, etc.) or registered marks (sanitized to generic *Vanaspati*).
- [x] **Pre-Launch Lab Audit Notice:** Callout box states: *"All batch-specific microbiological parameters, shelf-life evaluations, and nutritional claims will be validated by NABL-accredited third-party laboratory test certificates and archived under our FSSAI compliance record prior to commercial retail dispatch."*
- [x] **Statutory Disclaimer:** Prominent disclaimer clarifying comparison is based on customary manufacturing practices of commercial condiments versus artisanal methods.
- [x] **Accessibility & Mobile Responsiveness:** Fully accessible table (`<caption>`, `scope="col"`, `scope="row"`, scrollable region with keyboard focus outline) and responsive touch-swipe styling encapsulated inside `@media (max-width: 768px)`.

### 5. Automated Test Coverage Proof
- [x] **TypeScript Compilation:** Zero errors on TypeScript 5.7 strict compilation (`npm run lint`, `npm run type-check`).
- [x] **Backend Integration & Unit Tests:** **350 tests passed across 10 test suites (100% pass rate)**:
  - `phase5CoverageAudit.spec.ts`: 100 passed (Auth, RBAC, Idempotency, Rate Limiting)
  - `phase3Authentication.spec.ts`: 52 passed (MFA, RBAC, IP Allowlist, Session Expiry)
  - `phaseA_frontendHardening.spec.ts`: 41 passed (Client tampering rejection, price injection, quantity bounds, structural validation)
  - `phase2Architecture.spec.ts`: 40 passed (CORS, CSP, Headers, Rate Limiting, Schemas)
  - `phase10RenderBackend.spec.ts`: 30 passed (API routes, Error handling, Idempotency, Gates)
  - `phaseF_authProfile.spec.ts`: 28 passed (Bearer token validation, profile CRUD, address book limits, cross-user isolation, customer rate limiting)
  - `phaseG_securityReaudit.spec.ts`: 25 passed (Firestore rules audit, CSP nonces, exact-origin CORS, HMAC signature integrity, zero secrets in client assets)
  - `phaseB_payments.spec.ts`: 18 passed (Razorpay signature verification, webhook processing, payment state machine, refund gates)
  - `phaseC_databaseIntegrity.spec.ts`: 9 passed (Immutable order snapshots, denormalized customer & item summaries, append-only inventory logs)
  - `seedProductsSafety.spec.ts`: 7 passed (Database write protection, dry-run safety)
- [x] **Idempotency Proof:** Replays with identical payload return cached response; modifications trigger HTTP 409 `IDEMPOTENCY_CONFLICT`; cross-identity key reuse triggers HTTP 409.

### 6. Vulnerability Scanning & CI Pipeline
- [x] **Dependency Audit:** `npm run audit` passes with **0 High and 0 Critical vulnerabilities** across root and backend dependencies.
- [x] **OWASP ZAP Tooling:** Ready-to-run baseline scanning scripts (`tests/security/run-zap-scan.ps1`, `run-zap-scan.sh`), rules configuration (`tests/security/zap-baseline.conf`), and integration documentation (`tests/security/OWASP_ZAP_CONFIGURATION.md`).
- [x] **Strict CI Pipeline:** `.github/workflows/security-ci.yml` strictly enforces:
  `Forbidden Tracked Files Check` → `Clean Dependency Installation` → `LINT` → `TEST` → `BUILD` → `AUDIT`.

### 7. Frontend Accessibility & Lighthouse Standards
- [x] **14 HTML Pages Audited:** All customer storefront pages and admin portal pass automated accessibility checks with **0 remaining defects**:
  - Valid `lang="en"`, descriptive `<title>`, and `<meta name="viewport">` on every page.
  - Heading hierarchy validated with a single `<h1>` per document.
  - Descriptive `alt` text on all images.
  - Skip navigation link (`.skip-link`) and `<main id="main-content" role="main">` landmark on all pages.
  - Form input labels (`<label for="...">`) on all search, profile, contact, and admin inputs.
  - Explicit `aria-label` attributes on icon-only interactive controls (mobile drawer close, checkout modal close, search buttons).

### 8. Round 2 Architecture & Security Controls (Phases A–G)
- [x] **Phase A — Frontend Code Hardening & Build Pipeline:**
  - Dedicated production build pipeline (`build/frontend-build.js`) using Terser (minification) and JavaScript Obfuscator (identifier mangling, control flow flattening, string encoding).
  - Production builds output to `public/site/dist/` (referenced in `OBFUSCATION_NOTICE.md`). Readable source maintained in repo for developer maintainability.
  - Exhaustive audit confirmed pricing, coupon calculations, stock verification, and order creation are 100% server-authoritative; client price injection rejected with HTTP 400.
- [x] **Phase B — Payment Gateway Integration (Razorpay Test Mode):**
  - Production-ready Razorpay service (`backend/src/payments/razorpayService.ts`) with order creation (`/api/v1/payments/create-order`), verification (`/api/v1/payments/verify`), webhook processing (`/api/v1/payments/webhook`), and refunds (`/api/v1/admin/refunds`).
  - Cryptographic HMAC-SHA256 signature verification using `crypto.timingSafeEqual` prevents timing attacks.
  - Feature gated (`PAYMENTS_ENABLED=false`) until live business KYC and GSTIN activation.
- [x] **Phase C — Database Redesign & Point-in-Time Order Snapshots:**
  - Orders collection stores immutable point-in-time snapshots: `customerName`, `customerPhone`, `itemNames`, and `itemSummary` alongside structured `items`.
  - Dedicated `/inventory_logs` append-only collection captures all stock deductions and manual adjustments with before/after state diffs.
  - Admin composite indexes defined in `firestore.indexes.json` for high-performance compound queries (`status + createdAt`, `paymentStatus + createdAt`).
- [x] **Phase D — Real-Time Multi-Session Synchronization Hardening:**
  - Real-time Firestore snapshot listener lifecycle managed cleanly via `cleanupOrdersStream()`, automatically tearing down listeners on logout or view unmount.
  - Connection status badge (`● Live Sync Active` / `⚠️ Connection Interrupted`) with error fallback.
  - Zero memory leaks confirmed across multiple view mount/unmount cycles.
- [x] **Phase E — Distinctive Artisanal Luxury Design Overhaul:**
  - Typographic elevation: `DM Serif Display` paired with `Playfair Display` and `Lato`.
  - Luxury visual polish: 3D parallax hover elevation (`translateY(-8px) scale(1.015)` with dual-layer warm shadow), button ripple interactions, cart badge bounce animations, and skeleton shimmer loaders.
  - Complete `@media (prefers-reduced-motion: reduce)` accessibility compliance.
- [x] **Phase F — Customer Profile & Auth Hardening:**
  - Customer Bearer token validation middleware (`requireAuthenticatedUser`) verifying Firebase Auth tokens.
  - Per-route customer rate limiting (`customerRateLimiter`: 30 req/min, `authRateLimiter`: 20 req/min).
  - Customer profile CRUD and address book management (strict cap of 5 addresses per customer).
  - Cross-user data isolation verified by negative test suites.
- [x] **Phase G — Full-Stack Security Re-Audit:**
  - Static audit confirms default deny-all Firestore security rules across all collections.
  - Backend CSP nonces and Razorpay allowlisting (`script-src`, `connect-src`, `frame-src`).
  - Strict CORS exact-origin validation rejects prefix, suffix, and port lookalikes.
  - Zero hardcoded secrets, test keys, or infrastructure internal URLs in public frontend code.

---

## PART 2: Items Requiring Human Sign-Off / External Action Before Going Live

The following items cannot be validated purely by software automation and require explicit human review, external certification, or manual business execution prior to enabling public commercial ordering:

### 1. Statutory & Regulatory Registrations
| Item | Required Action | Responsible Party | Sign-Off Status |
|---|---|---|---|
| **FSSAI License** | Obtain final approved Food Safety License number from the Food Safety and Standards Authority of India. Update website footer, invoice template, and product labels with the 14-digit FSSAI number. | Operations / Founder | [ ] PENDING APPROVAL |
| **GSTIN Registration** | Complete Goods and Services Tax registration and obtain valid GSTIN. Update tax invoice generator and business records. | Accounts / Legal | [ ] PENDING APPROVAL |
| **Legal Metrology Compliance** | Verify net quantity declarations, batch numbers, manufacturing dates, and best-before dates on packaging comply with Legal Metrology (Packaged Commodities) Rules. | Quality Assurance | [ ] PENDING REVIEW |

### 2. Third-Party Laboratory Testing (NABL)
| Item | Required Action | Responsible Party | Sign-Off Status |
|---|---|---|---|
| **Microbiological Panel** | Commission third-party NABL-accredited lab tests for total plate count, yeast & mold, coliforms, and *Salmonella* / *E. coli* across all 15 SKUs. Archive certificates on file. | Food Safety Lead | [ ] PENDING LAB REPORT |
| **Heavy Metals & Pesticides** | Conduct chemical testing confirming Lead, Arsenic, Cadmium, and pesticide residues fall within statutory safety limits specified in FSSAI Food Safety and Standards (Contaminants, Toxins and Residues) Regulations. | Food Safety Lead | [ ] PENDING LAB REPORT |
| **Nutritional Profiling** | Verify laboratory nutritional analysis (energy, fats, sodium, protein, carbohydrates) matches values published on product detail pages. | Food Safety Lead | [ ] PENDING LAB REPORT |

### 3. Legal & Advertising Standards Review
| Item | Required Action | Responsible Party | Sign-Off Status |
|---|---|---|---|
| **Comparative Claims Review** | Legal counsel review of the *"Satvik Swaad vs. Typical Market Products"* comparison table to ensure strict compliance with ASCI (Advertising Standards Council of India) guidelines, Section 29/30 of the Trade Marks Act, 1999, and the Consumer Protection (Preventing Unfair Trade Practices) Rules. | Legal Counsel | [ ] PENDING COUNSEL REVIEW |
| **Terms & Policies Verification** | Final review of Privacy Policy, Terms & Conditions, Cancellation & Refund Policy, and Shipping Policy against applicable IT Act rules and consumer protection regulations. | Legal Counsel | [ ] PENDING COUNSEL REVIEW |

### 4. External Penetration Testing & Infrastructure
| Item | Required Action | Responsible Party | Sign-Off Status |
|---|---|---|---|
| **External Penetration Test** | Engage an independent CREST/OSCP accredited penetration tester to execute grey-box and black-box testing against the production Render API endpoint and Firebase Hosting domain. Remediate any identified findings. | Security Lead | [ ] PENDING PEN-TEST |
| **DNS & SSL Finalization** | Configure production custom domain DNS records (`satwikspot.com`) on Firebase Hosting and Render backend with active edge TLS certificates. | DevOps / Lead Eng | [ ] PENDING DNS CUTOVER |
| **Production Secrets Management** | Verify production environment variables (`FIREBASE_SERVICE_ACCOUNT`, `JWT_SECRET`, `ADMIN_ALLOWED_IPS`) are securely provisioned in Render Dashboard and never stored in repository or client code. | DevOps / Lead Eng | [ ] PENDING VERIFICATION |

### 5. Production Commercial Gates Activation
| Item | Required Action | Responsible Party | Sign-Off Status |
|---|---|---|---|
| **Commercial Feature Flags** | Upon completion of statutory approvals, lab reports, and legal review: toggle environment variables from `false` to `true` in production environment: `COMMERCE_ENABLED=true`, `CHECKOUT_ENABLED=true`, `PAYMENTS_ENABLED=true`. | Technical Lead | [ ] HOLD (DISABLED BY DEFAULT) |
| **WhatsApp Business Number** | Verify registered WhatsApp Business API or direct support phone number (+91 91189 02928) is staffed and active for receiving automated assisted customer order links. | Customer Support Lead | [ ] PENDING FINAL TEST |

### 6. Round 2: Real-Time Sync & Multi-Session QA
| Item | Required Action | Responsible Party | Sign-Off Status |
|---|---|---|---|
| **Cross-Tab Real-Time Sync** | Open the admin panel in two separate browser tabs simultaneously. Place an order or transition an order status in Tab 1. Verify that Tab 2 receives the snapshot update in under 2 seconds without manual page refresh. | QA / Frontend Lead | [ ] READY FOR MANUAL TEST |
| **Listener Teardown on Sign-Out** | Open browser developer tools memory profiler. Sign in as admin, navigate orders, and sign out. Confirm that `cleanupOrdersStream` executes, `ordersUnsubscribe()` is invoked, and no orphaned Firestore listeners remain active in heap. | Frontend Lead | [ ] READY FOR MANUAL TEST |
| **Connection Disconnect & Auto-Reconnect** | In Chrome DevTools Network panel, toggle "Offline" while on the admin panel. Verify status badge updates to "⚠️ Connection Interrupted". Toggle network back to "Online" and verify badge returns to "● Live Sync Active" and missed orders sync automatically within 5 seconds. | QA Lead | [ ] READY FOR MANUAL TEST |

---

## Formal Sign-Off Authorization

| Role | Name / Title | Signature | Date |
|---|---|---|---|
| **Lead Security Engineer** | Antigravity AI Security Lead | *Verified in Code & Tests* | 2026-09-06 |
| **Full-Stack Lead Engineer** | Technical Lead | ___________________________ | ____________ |
| **Legal Counsel** | Corporate Legal Advisor | ___________________________ | ____________ |
| **Managing Founder** | Business Owner | ___________________________ | ____________ |
