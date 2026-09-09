# ADMIN API SPECIFICATION

**Project**: Satwik Sweets and Pickels  
**Scope**: Protected Administrative Backend REST Endpoints  
**Date**: July 19, 2026  

---

## 1. Protected Admin Endpoint Map

All administrative endpoints require a valid Firebase Auth Bearer ID Token containing custom claim `admin: true`, App Check header, and specific role permissions.

| Endpoint | Method | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/admin/dashboard-summary` | `GET` | `order_manager` | Real-time server-calculated operational dashboard stats & qualifying revenue. |
| `/api/v1/admin/products` | `POST` | `catalog_manager` | Create new product document in Firestore catalog. |
| `/api/v1/admin/products/:id/archive` | `POST` | `catalog_manager` | Set `available: false` for a product document. |
| `/api/v1/admin/products/:id/stock` | `PATCH` | `catalog_manager` | Adjust product stock count with reason tracking. |
| `/api/v1/admin/orders/:id/transition`| `POST` | `order_manager` | Server-enforced order status transition (Pending -> Confirmed -> Preparing -> Packed -> Shipped -> Delivered / Cancelled). |
| `/api/v1/admin/messages/:id/status` | `POST` | `support_manager` | Update inquiry status (`new` -> `read` -> `resolved`). |
| `/api/v1/admin/reviews/:id/moderate` | `POST` | `review_moderator` | Moderate review (`approved: true` / `false`). |
| `/api/v1/admin/audit-events` | `GET` | `owner` | Read-only append-only audit event log list. |

---
*End of Admin API Specification.*
