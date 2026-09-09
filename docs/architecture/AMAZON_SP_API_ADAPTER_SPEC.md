# AMAZON SP-API ADAPTER SPECIFICATION

**Project**: Satwik Sweets and Pickels  
**Scope**: Amazon India Selling Partner API Connector Architecture (Feature-Gated)  
**Date**: July 19, 2026 (Corrected: Authorization model updated)  

---

## 1. Authentication & Authorization

### Current Design: Private Self-Authorized Application

Satvik Spot connects to its own single seller account using a private SP-API application. No multi-seller OAuth flow is implemented.

- **Authorization Method**: Self-authorization through the Amazon Seller Central developer interface.
- **Credential Set**:
  - LWA Client ID (from the developer application registration)
  - LWA Client Secret (stored in Secret Manager — never in code, logs, Firestore, or Git)
  - LWA Refresh Token (obtained during self-authorization — stored in Secret Manager)
- **Token Exchange**: Exchange refresh token for a short-lived LWA access token via `POST https://api.amazon.com/auth/o2/token`.
- **API Request Authentication**: Include the LWA access token in the `x-amz-access-token` header on every SP-API request.
- **Marketplace Roles**: Request only the roles required by implemented operations (Listings, Orders, Feeds, Reports). Additional restricted roles require separate Amazon approval.
- **Token Storage**: Google Cloud Secret Manager only. LWA Client Secret, Refresh Token, and Access Tokens never enter Firestore, frontend bundles, server logs, or Git.
- **Token Refresh**: Automatic refresh before expiry with retry and exponential backoff on transient failures. Access tokens are short-lived and not persisted beyond the request lifecycle.

> [!NOTE]
> **No AWS IAM credentials, AWS access keys, secret access keys, or AWS Signature Version 4 signing are required.** The SP-API uses LWA access tokens for request authentication.

### Future: Public Multi-Seller Application (Not Implemented)

If Satvik Spot ever needs to operate as a service provider for other sellers, a public application using full OAuth 2.0 authorization code flow through Login with Amazon would be required. This includes:

- OAuth 2.0 authorization redirect with secure state validation
- Approved redirect URI registered with Amazon
- Authorization code exchange for refresh token
- Secure refresh token storage per authorized seller
- Authorization renewal and consent management

This flow is **not implemented** for the current single-business use case and requires explicit owner approval before development.

---

## 2. Restricted Data Access

Operations involving protected buyer or customer information (e.g. shipping addresses, buyer names, phone numbers) require a **Restricted Data Token (RDT)**.

| Requirement | Status |
| :--- | :--- |
| Identify which operations require an RDT | Documented: Orders API buyer PII fields |
| Request only minimum restricted data roles | Architecture enforces least-privilege |
| Collect buyer PII only when fulfilment genuinely requires it | Self-ship fulfilment requires shipping address |
| Apply Amazon's data-protection requirements | Log redaction, encrypted transport, retention limits |
| Restricted-role approval from Amazon | `SELLER_ACCOUNT_APPROVAL_PENDING` |

> [!IMPORTANT]
> Restricted Data Token usage, restricted-role approval, and Amazon's data-protection policy compliance require verified seller account access and are marked as externally pending.

---

## 3. Adapter Interface Implementation

| Interface Method | Amazon SP-API Endpoint | Rate Limit Handling |
| :--- | :--- | :--- |
| `authorize()` | LWA Token Exchange (`POST /auth/o2/token`) | N/A |
| `refreshAuthorization()` | LWA Refresh Token Grant | Retry with backoff |
| `validateListing(product)` | Product Type Definitions API | Respect usage plan |
| `createOrUpdateListing(product)` | Listings Items API v2021-08-01 (`PUT /listings/{sku}`) | Exponential backoff + jitter |
| `updatePrice(sku, price)` | Feeds API (JSON_LISTINGS_FEED) | Burst/restore rate model |
| `updateInventory(sku, qty)` | Feeds API (JSON_LISTINGS_FEED) | Burst/restore rate model |
| `fetchOrders(since)` | Orders API v0 (`GET /orders`) | Honor `x-amzn-RateLimit-Limit` |
| `acknowledgeOrder(orderId)` | Orders API v0 | Honor Retry-After |
| `updateFulfilment(orderId, shipment)` | Feeds API (POST_ORDER_FULFILMENT_DATA) | Burst/restore rate model |
| `fetchReturns(since)` | Reports API (`GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA`) | Scheduled report polling |
| `fetchSettlements(since)` | Reports API (`GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2`) | Scheduled polling |
| `reconcile()` | Settlement Report cross-reference with internal ledger | Internal batch process |
| `healthCheck()` | Sellers API (`GET /sellers/v1/marketplaceParticipations`) | Single request |

---

## 4. Food & Grocery Specifics (Amazon India)

- **FSSAI Attribute**: Mandatory `fssai_license_number` in listing attributes.
- **Expiry Date Flag**: `is_expiration_dated_product: true` required for food items.
- **Vegetarian Mark**: `diet_type: Vegetarian` required where applicable.
- **Country of Origin**: Mandatory `country_of_origin: IN`.

---

## 5. Feature Gate

```typescript
const AMAZON_CONNECTOR_ENABLED = false; // Owner must explicitly enable
```

> [!WARNING]
> All Amazon SP-API operations are behind a disabled feature flag. No live API calls, credential storage, listing creation, or order imports occur until the owner explicitly enables the connector with verified seller account authorization.

---
*End of Amazon SP-API Adapter Specification.*
