# CANCELLATION AND REFUND POLICY — PLATFORM AUDIT REPORT
**Satvik Swaad (Satvik Spot Food E-Commerce Platform)**  
**Date**: July 22, 2026  
**Scope**: Repository Audit for Cancellation and Refund Policy Disclosures  
**Status**: COMPLETE

---

## Executive Summary

An empirical audit of the **Satvik Swaad** codebase (`backend/`, `functions/`, `public/site/`, `scripts/`) was conducted to evaluate all cancellation, return, replacement, exchange, refund, and payment reversal capabilities. This audit ensures the Cancellation and Refund Policy (`public/site/cancellation-refund-policy.html`) represents 100% factual accuracy without making unsupported claims regarding active refund gateways, return windows, restocking fees, or image upload capabilities.

---

## Detailed Cancellation & Refund Capability Inventory

| # | Feature / Practice | Operational Status | Repository Evidence | User-Facing Effect | Required Policy Disclosure | Risk of Inaccurate Wording | Owner Decision Required Before Commercial Launch |
|---|---|---|---|---|---|---|---|
| **1** | **Online Commerce & Checkout** | **Disabled / Gated** | `backend/src/config/environment.ts` (`COMMERCE_ENABLED=false`) | Submitting order requests returns HTTP 503 (`COMMERCE_NOT_AVAILABLE`) | Explicitly state online commerce, checkout, and online order processing are disabled; no sales occur | Falsely claiming online orders or refunds are active | Activation of commerce feature gate upon regulatory approval |
| **2** | **Online Order Cancellations** | **Disabled / Inactive** | `COMMERCE_ENABLED=false`, no customer cancellation endpoint exists | Customer order cancellations are non-operational | Disclose that operational online cancellation processing is currently unavailable | Promising specific cancellation windows (e.g. within 2 hours of order) | Determination of customer cancellation deadlines & fees |
| **3** | **Product Returns & Exchanges** | **Not Configured / Inactive** | Codebase contains no return authorization or exchange workflow | Returns, replacements, and exchanges for online purchases are inactive | State that return, replacement, and exchange services are currently inactive | Promising return windows for perishable homemade food items | Establishment of food safety return rules & non-returnable items |
| **4** | **Payment Reversals & Refunds** | **Disabled / Inactive** | `PAYMENTS_ENABLED=false`, no payment gateway refund APIs exist | Zero funds or payment cards are collected; zero online refunds occur | Disclose that payment reversals and refund processing are currently inactive as no funds are collected | Claiming active refund gateway integrations or bank credit timelines | Integration of payment gateway refund APIs & refund methods |
| **5** | **Customer Evidence / Photo Uploads** | **Disabled / Deferred** | Deferred due to Firebase Storage billing block | Customers cannot upload photos or evidence files on the platform | Disclose that file uploads are inactive; issue inquiries must be submitted via text on `contact.html` | Falsely instructing customers to upload photo proof on the site | Enabling Firebase Storage billing for evidence uploads |
| **6** | **Catalogue Browsing & Local Cart** | **Active (Informational / Local)** | `public/site/products.html`, `public/site/script.js` (`satvik_cart`) | Catalogue displays 15 products; cart items persist locally in browser | State that catalogue browsing and local cart storage do not reserve stock or constitute an accepted order | Implying cart items guarantee product reservation or order placement | None |
| **7** | **Marketplace Sync (Refunds)** | **Disabled / Gated** | `backend/src/config/environment.ts` (`MARKETPLACE_AMAZON_ENABLED=false`) | External marketplace sync is inactive | State that marketplace cancellation and refund synchronization is currently disabled | Claiming active Amazon/Flipkart refund processing | Marketplace seller account activation |
| **8** | **Perishable Food Safety Rules** | **Pending Owner / Legal Approval** | Storefront features food items (pickles, murabbas, laddus) in glass jars | Food safety return restrictions must be established before commercial launch | Disclose that food safety return eligibility rules will be published prior to commercial launch | Promising returns on opened or perishable food items | Approval of perishable food return policy & safety guidelines |
| **9** | **Statutory Consumer Rights** | **Acknowledged / Non-Waivable** | Indian Consumer Protection Act (2019) compliance | Statutory rights under Indian consumer law are preserved | Explicitly affirm that non-waivable statutory rights under applicable Indian law are preserved | Unlawfully waiving consumer statutory rights or declaring all sales final | None |
| **10** | **FSSAI & GST Registrations** | **Pending Approval** | `public/site/index.html` ("FSSAI Licence: PENDING", "GSTIN: PENDING") | Displayed as PENDING across storefront footers | Disclose FSSAI Licence and GSTIN status as pending regulatory approval | Inventing fake registration or licence numbers | Obtaining official FSSAI & GSTIN numbers |
| **11** | **Customer Support Channel** | **Active** | `backend/src/messages/messageController.ts`, `public/site/contact.html` | Messages sent via `POST /api/v1/messages` are saved in Firestore `'messages'` | Direct cancellation and policy inquiries to the official Contact page (`contact.html`) | Publishing fake phone numbers or physical office addresses | Official owner support email when available |

---

## Verification Summary

- [x] **Commerce Status**: Disabled (`COMMERCE_ENABLED=false`).
- [x] **Refund & Return Operations**: Inactive for online orders.
- [x] **Refund Gateways & Timelines**: Zero fake refund timelines or fees claimed.
- [x] **Privacy, Terms & Shipping Alignment**: 100% consistent with disclosures in [PRIVACY_POLICY_DATA_FLOW_AUDIT.md](file:///u:/SatvikSwad/PRIVACY_POLICY_DATA_FLOW_AUDIT.md), [TERMS_AND_CONDITIONS_PLATFORM_AUDIT.md](file:///u:/SatvikSwad/TERMS_AND_CONDITIONS_PLATFORM_AUDIT.md), and [SHIPPING_AND_DELIVERY_PLATFORM_AUDIT.md](file:///u:/SatvikSwad/SHIPPING_AND_DELIVERY_PLATFORM_AUDIT.md).
