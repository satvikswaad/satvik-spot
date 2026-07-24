# TERMS AND CONDITIONS — PLATFORM AUDIT REPORT
**Satvik Swaad (Satvik Spot Food E-Commerce Platform)**  
**Date**: July 22, 2026  
**Scope**: Platform Audit for Terms and Conditions Disclosures  
**Status**: COMPLETE

---

## Executive Summary

An empirical audit of the **Satvik Swaad** codebase (`backend/`, `functions/`, `public/site/`, `public/admin/`, `scripts/`) was conducted to evaluate active, disabled, and deferred platform capabilities. This audit ensures the Terms and Conditions page (`public/site/terms-and-conditions.html`) reflects 100% factual accuracy without claiming non-existent functionality or making unsupported legal guarantees.

---

## Detailed Platform Capability Inventory

| # | Feature / Practice | Operational Status | Repository Evidence | User-Facing Effect | Required Terms Disclosure | Risk of Inaccurate Wording | Owner Decision Required |
|---|---|---|---|---|---|---|---|
| **1** | **Customer Account & Auth** | **Active** | `backend/src/auth/verifyAuth.ts`, `public/site/firebase-config.js` | Customers can register/login with email & password via Firebase Auth | Account eligibility (18+), credential security responsibility, session management | Claiming non-existent verification steps or misrepresenting account rights | Owner review of account termination terms |
| **2** | **Product Catalogue & Browsing** | **Active (Catalog Only)** | `backend/src/products/productData.ts`, `public/site/products.html` | Visitors can browse 15 authentic homemade food products, ingredients, & prices | Catalogue information is for viewing only; product details & availability subject to change | Implying catalogue browsing constitutes an offer for sale | Finalization of official commercial pricing |
| **3** | **Cart & Local Storage** | **Active (Local Cart)** | `public/site/script.js` (`localStorage.getItem('satvik_cart')`) | Selected products persist in browser `localStorage` across refreshes | Cart items are stored on user device; adding items does not reserve stock or form a contract | Claiming cart items create a binding purchase order | None |
| **4** | **Contact Form & Messages** | **Active** | `backend/src/messages/messageController.ts`, `public/site/contact.html` | Messages sent via `POST /api/v1/messages` are saved in Firestore `'messages'` | Support inquiry process, acceptable communication use, prohibition of spam/abuse | Claiming instant response guarantees or fake phone/email contacts | Official owner support email when available |
| **5** | **Product Reviews & Moderation** | **Active (Moderated)** | `backend/src/reviews/reviewController.ts` | Reviews submitted via `POST /api/v1/reviews` are held for admin moderation | User content license, review submission guidelines, owner right to moderate/remove reviews | Claiming un-moderated publishing or restricting lawful feedback | Review moderation guidelines approval |
| **6** | **Online Checkout & Commerce** | **Disabled / Gated** | `backend/src/config/environment.ts` (`COMMERCE_ENABLED=false`) | Checkout requests return HTTP 503 (`COMMERCE_NOT_AVAILABLE`) | Explicitly state online checkout is disabled; no online orders are accepted or processed | Falsely claiming online ordering is active or taking payments | Activation of commerce feature gate upon regulatory approval |
| **7** | **Payment Gateway & Processing** | **Disabled / Gated** | `backend/src/config/environment.ts` (`PAYMENTS_ENABLED=false`) | Payment processing endpoint returns HTTP 503 (`PAYMENTS_NOT_AVAILABLE`) | Disclose that online payment processing is inactive; zero payment card or banking details collected | Implying payment cards or UPI are currently accepted | Selection of PCI-DSS compliant payment gateway |
| **8** | **Delivery & Shipping Services** | **Disabled / Unavailable** | `COMMERCE_ENABLED=false`, Shipping Policy pending | Physical shipping for online orders is inactive | State that delivery for online orders is currently inactive; detailed Shipping Policy to follow | Promising delivery timelines, charges, or regions not yet operational | Finalization of shipping partner & delivery zones |
| **9** | **Cancellations & Refunds** | **Disabled / Unavailable** | `PAYMENTS_ENABLED=false`, Refund Policy pending | No online orders exist to cancel or refund | State that cancellation & refund terms apply only when online ordering is enabled | Promising specific refund timelines or policies before approval | Finalization of Cancellation & Refund Policy |
| **10** | **Marketplace Integration** | **Disabled / Gated** | `backend/src/config/environment.ts` (`MARKETPLACE_AMAZON_ENABLED=false`) | Amazon SP-API & Flipkart adapters disabled | State that external marketplace sync is currently inactive | Claiming active integration with Amazon or Flipkart | Marketplace seller account setup |
| **11** | **File & Image Uploads** | **Disabled / Deferred** | Deferred due to Firebase Storage billing block | Zero file upload forms | Disclose that user media/file upload features are deferred and inactive | Claiming active user avatar or image upload features | Enabling Firebase Storage billing |
| **12** | **FSSAI & GST Registrations** | **Pending Approval** | `public/site/index.html` ("FSSAI Licence: PENDING", "GSTIN: PENDING") | Displayed as PENDING in footers | Disclose FSSAI Licence and GSTIN status as pending approval; no fake numbers | Inventing fake registration or licence numbers | Obtaining official FSSAI & GSTIN numbers |
| **13** | **Admin Subsystem & Security** | **Active** | `backend/src/admin/adminController.ts`, `backend/src/auth/adminMiddleware.ts` | Server-authoritative custom claims (`admin_owner`) guard admin portal | Intellectual property ownership, system security rules, prohibition of hacking attempts | Exposing internal security endpoints or admin UIDs | None |
| **14** | **Warranties & Liability** | **Conservative Disclaimers** | `backend/src/app.ts` (App Check, rate limiting) | Platform provided "as is"; technical rate limits enforced | Conservative disclaimer of warranties, reasonable limitation of liability under Indian law | Claiming 100% uptime, bulletproof security, or illegal liability waivers | Legal counsel review of terms |
| **15** | **Governing Law & Disputes** | **Pending Owner Review** | Standard Indian legal framework | Subject to laws of India | Governed by Indian law; specific court jurisdiction marked for owner/legal review | Inventing fake court jurisdiction without owner confirmation | Designation of specific city/court jurisdiction |

---

## Verification Summary

- [x] **Commerce Status**: Disabled (`COMMERCE_ENABLED=false`).
- [x] **Checkout & Payments**: Disabled (`CHECKOUT_ENABLED=false`, `PAYMENTS_ENABLED=false`).
- [x] **Storage & Marketplace**: Disabled / Deferred.
- [x] **Regulatory Registrations**: Marked as `PENDING`.
- [x] **Privacy Policy Alignment**: 100% consistent with disclosures in [PRIVACY_POLICY_DATA_FLOW_AUDIT.md](file:///u:/SatvikSwad/PRIVACY_POLICY_DATA_FLOW_AUDIT.md).
