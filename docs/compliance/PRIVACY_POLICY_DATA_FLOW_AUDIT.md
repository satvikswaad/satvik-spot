# PRIVACY POLICY — DATA FLOW AUDIT REPORT
**Satvik Swaad (Satvik Spot Food E-Commerce Platform)**  
**Date**: July 22, 2026  
**Scope**: Codebase & Data Flow Audit for Privacy Policy Disclosures  
**Status**: COMPLETE

---

## Executive Summary

An exhaustive audit of the **Satvik Swaad** codebase (`backend/`, `functions/`, `public/site/`, `public/admin/`, `scripts/`) was conducted to inspect all active, disabled, and deferred data flows. This audit serves as the empirical foundation for the customer-facing Privacy Policy, ensuring 100% alignment with actual repository implementation.

---

## Detailed Data Flow Inventory

| # | Data Category | Data Collected | Collection Source | Purpose | Storage Location | Access Authority | Retention Behavior | Sharing / Processor | Active Status | Repository Evidence | Required Disclosure |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **1** | **Customer Account & Auth** | Email, password (hashed server-side), display name, UID, auth timestamp (`auth_time`) | Firebase Auth SDK (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`) | Customer identity verification, session management | Firebase Auth Infrastructure (GCP), browser IndexedDB / LocalStorage | Customer (self), Backend Admin SDK | Retained until user account deletion request | Google Cloud / Firebase Auth | **Active** | `backend/src/auth/verifyAuth.ts`, `public/site/firebase-config.js` | Firebase Auth usage, session token cache, credential security |
| **2** | **Contact Inquiries** | Name (2-100 chars), email (optional), phone (optional), subject (optional), message body (5-500 chars), submission timestamp | Contact form via `POST /api/v1/messages` | Customer support, responding to inquiries, data requests | Cloud Firestore collection `'messages'` | Backend service account, `admin_owner` | Retained for support records; deleted upon user request | Google Cloud Firestore, Render backend host | **Active** | `backend/src/messages/messageController.ts`, `backend/src/app.ts` | Processing of contact messages, storage in Firestore, support purpose |
| **3** | **Order & Checkout Data** | Customer name, phone, address, payment method selection, items (`productId`, `quantity`), idempotency key, total amount | Order placement via `POST /api/v1/orders/create` | Order fulfillment (when commerce is enabled) | Cloud Firestore collection `'orders'` | Guest order lookup (with secret), `admin_owner` | Retained for order history, accounting | Cloud Firestore, Render backend | **Disabled / Gated** (`COMMERCE_ENABLED=false`, `CHECKOUT_ENABLED=false`) | `backend/src/orders/orderController.ts`, `backend/src/config/environment.ts` | State clearly that online ordering & checkout are disabled; no card/UPI details collected |
| **4** | **Product Reviews & Ratings** | Author name/alias, product ID, rating (1-5), review text, moderation status (`approved: false`), timestamp | Review submission via `POST /api/v1/reviews` | Public customer feedback, owner moderation | Cloud Firestore collection `'reviews'` | Public read for approved reviews, `admin_owner` for moderation | Retained while product is listed; subject to moderation | Displayed publicly when approved | **Active** | `backend/src/reviews/reviewController.ts` | Public display of approved reviews, owner moderation requirement |
| **5** | **Admin Identity & Security Logs** | Admin UID, email, custom claims (`{ admin: true, role: 'admin_owner' }`), action name, target UID/ref, IP address, timestamp | Auth middleware, admin routes (`/archive`, `/transition`), CLI tool | Access control, security auditing, incident containment | Cloud Firestore collection `'audit_logs'`, server log files | Backend service account, `admin_owner` | Retained for security compliance | Internal security logs only | **Active** | `backend/src/audit/auditLogger.ts`, `scripts/admin-cli.ts` | System security logging, role-based access enforcement |
| **6** | **Technical & Network Info** | Client IP address (`req.ip`), User-Agent, request timestamp, HTTP path/method, response status | Render reverse proxy (`X-Forwarded-For`), Express application server | Abuse prevention, IP rate limiting, DDoS mitigation, diagnostic logs | Transient server memory (rate limiter), Render access logs | Render cloud host, application backend | Transient in memory; standard web host log retention | Render Cloud Host | **Active** | `backend/src/rateLimiting/rateLimiter.ts`, `app.set('trust proxy', 1)` | IP-based rate limiting, DDoS protection, standard server log collection |
| **7** | **Cookies & Browser Storage** | Local cart state (`satvik_cart`), Firebase Auth token cache | Browser LocalStorage, IndexedDB (`public/site/script.js`) | Persisting shopping cart across refreshes, login state | Client browser LocalStorage / IndexedDB | Client browser only | Stored locally on user device until cleared by user | None (Client-side only) | **Active** | `public/site/script.js` (`localStorage.getItem('satvik_cart')`) | LocalStorage usage for cart/auth; zero third-party tracking cookies |
| **8** | **Analytics & Ad Tracking** | None | None | N/A | N/A | N/A | N/A | None (Zero tracking scripts) | **Active (Zero Tracking)** | `public/site/index.html`, `script.js` | Disclose zero third-party tracking scripts or advertising pixels |
| **9** | **Payment Gateway Integration** | Credit card numbers, UPI PINs, CVVs, banking credentials | None (Disabled) | N/A | N/A | N/A | N/A | None | **Disabled / Gated** (`PAYMENTS_ENABLED=false`) | `backend/src/config/environment.ts` | Expressly state payment processing is disabled and zero financial data is collected |
| **10** | **File & Image Uploads** | User avatar, image attachments | None (Deferred) | N/A | N/A | N/A | N/A | None | **Disabled / Deferred** (Firebase Storage billing block) | Workspace architecture specification | Expressly state file upload / Storage features are deferred |
| **11** | **Marketplace Sync** | Amazon SP-API & Flipkart partner data | None (Disabled) | N/A | N/A | N/A | N/A | None | **Disabled / Gated** (`MARKETPLACE_AMAZON_ENABLED=false`) | `backend/src/marketplace/` | Expressly state marketplace synchronization is currently inactive |
| **12** | **FSSAI & GST Registrations** | FSSAI License No., GSTIN | Pending Regulatory Approval | Regulatory compliance | N/A | N/A | N/A | N/A | **Pending Approval** | `public/site/index.html` ("FSSAI Licence: PENDING") | Display regulatory status as PENDING; no fake numbers |

---

## Empirical Verification Checklist

- [x] **Firebase Auth**: Active and cryptographic token verification enforced (`verifyAuth.ts`).
- [x] **Cloud Firestore**: Active primary database with default-deny rules (`firestore.rules`).
- [x] **Render Backend**: Single active application backend host (`satvik-spot-backend`).
- [x] **Commerce & Payments**: Disabled across all environments (`COMMERCE_ENABLED=false`).
- [x] **Firebase Storage**: Deferred due to billing/autopay block.
- [x] **Third-Party Trackers**: Zero tracking scripts, zero advertising pixels, zero third-party cookies.
- [x] **Regulatory Status**: FSSAI and GST details remain `PENDING`.
