# FLIPKART SELLER API ADAPTER SPECIFICATION

**Project**: Satwik Sweets and Pickels  
**Scope**: Flipkart India Seller API Connector Architecture (Feature-Gated)  
**Date**: July 19, 2026  

---

## 1. Authentication & Authorization

- **Method**: OAuth 2.0 Bearer Token (Client Credentials or Authorization Code grant per current Flipkart docs).
- **Token Storage**: Google Cloud Secret Manager only. Tokens never enter Firestore, frontend, or Git.
- **Token Refresh**: Automatic refresh before expiry.

> [!NOTE]
> Exact current API availability requires authenticated Seller Hub access. Endpoints below are based on publicly documented Flipkart Seller API specifications. Items marked `SELLER_LOGIN_VERIFICATION_PENDING` require verification once seller account access is available.

---

## 2. Adapter Interface Implementation

| Interface Method | Flipkart API Endpoint | Verification Status |
| :--- | :--- | :--- |
| `authorize()` | OAuth Token Exchange | Publicly documented |
| `refreshAuthorization()` | OAuth Refresh Grant | Publicly documented |
| `validateListing(product)` | Listing Catalog Validation | `SELLER_LOGIN_VERIFICATION_PENDING` |
| `createOrUpdateListing(product)` | Listing Management API | `SELLER_LOGIN_VERIFICATION_PENDING` |
| `updatePrice(sku, price)` | Price Update API | `SELLER_LOGIN_VERIFICATION_PENDING` |
| `updateInventory(sku, qty)` | Inventory API (`PUT /inventory`) | Publicly documented |
| `fetchOrders(since)` | Order Management API v3 (`GET /orders`) | Publicly documented |
| `acknowledgeOrder(orderId)` | Order Acknowledgement | `SELLER_LOGIN_VERIFICATION_PENDING` |
| `updateFulfilment(orderId, shipment)` | Dispatch / Shipment API | `SELLER_LOGIN_VERIFICATION_PENDING` |
| `fetchReturns(since)` | Returns API | `SELLER_LOGIN_VERIFICATION_PENDING` |
| `fetchSettlements(since)` | Settlement API | `SELLER_LOGIN_VERIFICATION_PENDING` |
| `reconcile()` | Internal batch cross-reference | Internal process |
| `healthCheck()` | Account Status / Seller Details | `SELLER_LOGIN_VERIFICATION_PENDING` |

---

## 3. Food & Grocery Specifics (Flipkart India)

- **FSSAI Licence**: Mandatory during seller onboarding and listing creation for food category.
- **MRP Enforcement**: Listing price must not exceed printed MRP.
- **Vegetarian Declaration**: Required where applicable.

---

## 4. Feature Gate

```typescript
const FLIPKART_CONNECTOR_ENABLED = false; // Owner must explicitly enable
```

> [!WARNING]
> All Flipkart Seller API operations are behind a disabled feature flag. No live API calls occur until verified seller account authorization.

---
*End of Flipkart Seller API Adapter Specification.*
