# EXTERNAL VERIFICATION & APPROVED OWNER DECISIONS

**Project**: Satwik Sweets and Pickels  
**Date**: July 19, 2026  

---

## 1. Approved Owner Architectural Decisions (Phase 0B) — RECORDED & CONFIRMED

> [!NOTE]
> All Phase 0B architectural decisions are formally APPROVED by the store owner and locked for implementation.

- [x] **Decision 1: Guest Checkout Architecture** — **APPROVED (Option B)**:
  - **Secure Guest Checkout**: Backend generates a cryptographically secure, high-entropy order-access secret (`crypto.randomBytes(32)` / SHA-256 hash).
  - **Access Restriction**: Guest order status lookup requires both the Order ID and the guest access secret. Phone number alone or sequential IDs will **NEVER** grant access to an order document.

- [x] **Decision 2: Trusted Execution Layer Platform** — **APPROVED (Option A)**:
  - **Firebase Cloud Functions (Node.js & TypeScript)**: Native serverless backend execution environment.
  - **Testing Pipeline**: Developed and tested locally using the Firebase Emulator Suite before any production deployment.

- [x] **Decision 3: Admin Provisioning Execution Model** — **APPROVED (Option A)**:
  - **One-time Local Firebase Admin SDK CLI Script**: Run locally by the store owner using service account credentials.
  - **Public Endpoint Policy**: No publicly callable super-admin provisioning HTTP function will be created.

---

## 2. Infrastructure & External Services Verification Items

- [ ] **Production API Key Restrictions**:
  - Restrict Firebase Web API Key in Google Cloud Console to specific HTTP Referrers (`https://satwiksweetsandpickels.web.app/*`).
- [ ] **Firebase App Check Integration**:
  - Register web app with reCAPTCHA v3 / Enterprise attestation provider.
  - Enable App Check token enforcement in Cloud Functions and Firestore.
- [ ] **Payment Provider Webhook HMAC Credentials**:
  - Provisioning of webhook signing secrets for Razorpay / Paytm / Stripe in Phase 5/6.
- [ ] **Notification Gateway Services**:
  - Transactional SMS gateway (Twilio / MSG91) credentials for OTP & shipping alerts.
  - Transactional Email provider (SendGrid / Mailgun) credentials.
- [ ] **Marketplace Integration Credentials**:
  - Amazon SP-API and Flipkart Marketplace API credentials for Phase 9 inventory synchronization.

---
*End of Approved Decisions Record.*
