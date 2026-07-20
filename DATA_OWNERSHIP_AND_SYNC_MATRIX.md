# DATA OWNERSHIP AND SYNCHRONIZATION MATRIX

**Project**: Satwik Sweets and Pickels  
**Scope**: Authoritative Data Sources, State Ownership & Synchronization Policies  
**Date**: July 19, 2026  

---

## 1. Canonical Data Ownership Model

| Entity | Primary Authoritative Source | Mutation Authority | Client Synchronization Policy |
| :--- | :--- | :--- | :--- |
| **Product Catalog** | Firestore (`/products`) | Admin Custom Claim (`token.admin == true`) | Read-only real-time stream / fetch from Firestore. Hardcoded catalog arrays removed. |
| **Product Prices** | Firestore (`/products/{id}.price`) | Trusted Backend (`orderService.ts`) | Prices in browser cart are treated as untrusted UI hints. Authoritative price fetched in transaction during checkout. |
| **Product Inventory** | Firestore (`/products/{id}.stock`)| Trusted Backend Transaction | Atomic deduction inside `db.runTransaction()` during checkout. Out-of-stock returned if stock insufficient. |
| **Orders** | Cloud Functions (`/api/v1/orders/create`) | Cloud Functions / Admin SDK | Direct browser creation DENIED. Order document created exclusively by server. |
| **Order Status** | Firestore (`/orders/{id}.status`) | Trusted Backend / Admin API | Direct browser mutation DENIED. Transition rules enforced by server. |
| **Messages** | Cloud Functions (`/api/v1/messages`) | Cloud Functions / Admin SDK | Direct browser creation/mutation DENIED. Submissions sent via backend API to Firestore `/messages`. |
| **Reviews** | Cloud Functions (`/api/v1/reviews`) | Customer Submit / Admin Moderate | Submissions created with `approved: false`. Public query reads only `approved == true`. |
| **Customer Order Access** | Firestore `/orders` | Security Rule / Guest Lookup | Authenticated user reads own UID orders (`userId == auth.uid`). Guests track via backend secret lookup. |
| **`localStorage`** | Client Browser | Client UI Layer | Convenience UI cache only (cart item IDs, last order ID). Never used as authoritative business data. |

---

## 2. Synchronization Rules

1. **No Trusted Client Data**: Browser requests transmit **only** IDs, requested quantities, and user inputs. Monetary totals, stock levels, approval flags, and order statuses are set strictly by the server.
2. **Immutable Order Snapshots**: Each order document includes an immutable array of item snapshots (`productId`, `sku`, `name`, `unitPrice`, `qty`, `lineTotal`) captured at checkout time. Future catalog price updates do NOT alter past order totals.
3. **Cache Invalidation & Error Correction**: If catalog prices or stock change while a user is shopping, the server checkout pipeline rejects out-of-stock items or re-calculates the exact authoritative total, returning a clear error response.

---
*End of Data Ownership and Sync Matrix.*
