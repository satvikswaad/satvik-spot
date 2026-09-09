# MARKETPLACE OFFICIAL REQUIREMENTS RESEARCH

**Project**: Satwik Sweets and Pickels  
**Scope**: Official Developer & Seller Hub Specifications for Amazon India & Flipkart  
**Date**: July 19, 2026 (Corrected: Amazon authorization model updated)  

---

## 1. Amazon India (Selling Partner API & Seller Central)

- **Source URL**: `https://developer-docs.amazon.com/sp-api/`
- **Page Title**: Amazon Selling Partner API (SP-API) Documentation
- **Access Date**: July 19, 2026 | **Region**: IN (India)
- **Authentication**:
  - **Private Application (current)**: Self-authorization via Seller Central. LWA Client ID, Client Secret, and Refresh Token obtained during developer registration. Exchange refresh token for short-lived LWA access token (`POST https://api.amazon.com/auth/o2/token`). Include access token in `x-amz-access-token` header on SP-API requests.
  - **Public Application (not implemented)**: OAuth 2.0 Authorization Code flow via Login with Amazon for multi-seller service provider use. Not required for single-business use case.
  - **No AWS IAM / Signature V4**: SP-API requests are authenticated with LWA access tokens. AWS IAM credentials and Signature Version 4 signing are not required.
  - **Restricted Data Tokens**: Operations accessing buyer PII (shipping addresses, buyer names) require a Restricted Data Token (RDT) obtained via the Tokens API. Restricted-role approval is externally pending.
- **Key API Modules**:
  - **Listings Items API v2021-08-01**: Catalog submission, attribute validation, Product Type Definitions for `PICKLE`, `FOOD_PRESERVE`, `SWEET`.
  - **Orders API v0**: Order retrieval, buyer information access (subject to Restricted Data Token requirements).
  - **Feeds API v2021-06-30**: Bulk inventory & price updates via JSON schema feeds.
  - **Reports API v2021-06-30**: Settlement reports (`GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2`).
  - **Tokens API**: Restricted Data Token creation for PII-protected operations.
- **Food & Grocery Specifics**:
  - FSSAI License Number mandatory in listing attributes.
  - Mandatory food declarations: Expiry date flag, net weight, ingredients, allergen info, vegetarian/non-vegetarian mark (Green Dot logo).

---

## 2. Flipkart India (Seller Hub & Seller APIs)

- **Source URL**: `https://seller.flipkart.com/api-docs/`
- **Page Title**: Flipkart Seller API Developer Portal
- **Access Date**: July 19, 2026 | **Region**: IN (India)
- **Authentication**: OAuth 2.0 Bearer Token.
- **Key API Modules**:
  - **Listing Management API**: FSN (Flipkart Serial Number) mapping, SKU creation, price/MRP validation.
  - **Order Management API v3**: Order lifecycle (APPROVED -> PACKED -> READY_TO_DISPATCH -> SHIPPED -> DELIVERED).
  - **Inventory API**: Stock quantity update per FSN/SKU location.
  - **Settlement & Returns API**: Invoice reconciliation and return request processing.
- **Food & Grocery Specifics**:
  - Mandatory FSSAI license input during seller onboarding and listing creation.
  - MRP enforcement (listing price cannot exceed printed MRP).

---
*End of Marketplace Official Requirements Research.*
