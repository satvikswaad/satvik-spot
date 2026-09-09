# SHIPPING AND DELIVERY POLICY — PLATFORM AUDIT REPORT
**Satvik Swaad (Satvik Spot Food E-Commerce Platform)**  
**Date**: July 22, 2026  
**Scope**: Repository Audit for Shipping and Delivery Policy Disclosures  
**Status**: COMPLETE

---

## Executive Summary

An empirical audit of the **Satvik Swaad** codebase (`backend/`, `functions/`, `public/site/`, `scripts/`) was conducted to evaluate all shipping, delivery, dispatch, and order fulfillment capabilities. This audit ensures the Shipping and Delivery Policy (`public/site/shipping-delivery-policy.html`) represents 100% factual accuracy without making fake claims about active delivery partners, shipping fees, delivery timelines, or tracking services.

---

## Detailed Shipping & Delivery Capability Inventory

| # | Feature / Practice | Operational Status | Repository Evidence | User-Facing Effect | Required Policy Disclosure | Risk of Inaccurate Wording | Owner Decision Required Before Launch |
|---|---|---|---|---|---|---|---|
| **1** | **Online Commerce & Checkout** | **Disabled / Gated** | `backend/src/config/environment.ts` (`COMMERCE_ENABLED=false`) | Submitting order requests returns HTTP 503 (`COMMERCE_NOT_AVAILABLE`) | Explicitly state online commerce and checkout are disabled; no online orders are processed | Falsely claiming online ordering or shipping is active | Activation of commerce feature gate upon regulatory approval |
| **2** | **Physical Shipping & Logistics** | **Disabled / Inactive** | `COMMERCE_ENABLED=false`, no courier integrations exist | Physical shipping for online orders is inactive | Disclose that physical shipping and delivery for online orders are currently inactive | Inventing fake courier partners, shipping fees, or delivery zones | Selection of logistics partners & serviceability zones |
| **3** | **Shipping Fees & Free-Delivery Thresholds** | **Not Configured / Inactive** | No shipping fee calculation logic in `backend/src/orders/` | Zero shipping fees charged or calculated | State that shipping charges and free-delivery thresholds will be published prior to commercial launch | Promising specific delivery fees or free shipping thresholds | Determination of shipping fee structure & free delivery threshold |
| **4** | **Dispatch & Delivery Timelines** | **Not Configured / Inactive** | No dispatch scheduling or SLA logic exists | Zero delivery commitments | Disclose that dispatch times and delivery estimates will be established upon commercial launch | Promising specific delivery windows (e.g., 2-3 days, same-day delivery) | Establishment of batch preparation & dispatch SLAs |
| **5** | **Catalogue Browsing & Local Cart** | **Active (Informational / Local)** | `public/site/products.html`, `public/site/script.js` (`satvik_cart`) | Catalogue displays 15 products; cart items persist locally in browser | State that catalogue browsing and local cart storage do not reserve stock or constitute an accepted order | Implying cart items guarantee product reservation or delivery | None |
| **6** | **Live Order Tracking** | **Disabled / Inactive** | `backend/src/orders/orderController.ts` (guest lookup inactive) | Live order tracking is non-operational for public purchases | Disclose that live order tracking is currently inactive while online commerce is disabled | Falsely claiming active courier tracking links or SMS updates | Integration of courier tracking API |
| **7** | **International Shipping** | **Not Offered** | No international shipping or export logic in codebase | International delivery unavailable | Explicitly state international shipping is not offered | Implying worldwide or cross-border delivery is available | None |
| **8** | **Marketplace Fulfillment** | **Disabled / Gated** | `backend/src/config/environment.ts` (`MARKETPLACE_AMAZON_ENABLED=false`) | External marketplace fulfillment is inactive | State that external marketplace synchronization (Amazon/Flipkart) is disabled | Claiming active Amazon FBA or Flipkart seller fulfillment | Marketplace seller account activation |
| **9** | **Media / File Uploads** | **Disabled / Deferred** | Deferred due to Firebase Storage billing block | Zero file upload forms | Disclose that user file/image upload features are deferred and inactive | Claiming active file upload features | Enabling Firebase Storage billing |
| **10** | **Cancellation & Refund Policy Link** | **Pending Publication** | Cancellation & Refund Policy not yet published | No online purchases exist to cancel/refund | Refer to cancellation and refund terms as pending publication before commerce launch | Adding dead links or promising specific refund timelines | Completion of Cancellation and Refund Policy |
| **11** | **FSSAI & GST Registrations** | **Pending Approval** | `public/site/index.html` ("FSSAI Licence: PENDING", "GSTIN: PENDING") | Displayed as PENDING across storefront footers | Disclose FSSAI Licence and GSTIN status as pending regulatory approval | Inventing fake registration or licence numbers | Obtaining official FSSAI & GSTIN numbers |
| **12** | **Customer Support Channel** | **Active** | `backend/src/messages/messageController.ts`, `public/site/contact.html` | Messages sent via `POST /api/v1/messages` are saved in Firestore `'messages'` | Direct shipping policy questions to the official Contact page (`contact.html`) | Publishing fake phone numbers or physical office addresses | Official owner support email when available |

---

## Verification Summary

- [x] **Commerce Status**: Disabled (`COMMERCE_ENABLED=false`).
- [x] **Shipping Operations**: Inactive for online orders.
- [x] **Courier Partners & Fees**: Zero fake fees or partners claimed.
- [x] **Privacy & Terms Alignment**: 100% consistent with disclosures in [PRIVACY_POLICY_DATA_FLOW_AUDIT.md](file:///u:/SatvikSwad/PRIVACY_POLICY_DATA_FLOW_AUDIT.md) and [TERMS_AND_CONDITIONS_PLATFORM_AUDIT.md](file:///u:/SatvikSwad/TERMS_AND_CONDITIONS_PLATFORM_AUDIT.md).
