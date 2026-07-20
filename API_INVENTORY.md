# API INVENTORY (PHASE 10A — COMPLETE)

**Project**: Satwik Sweets and Pickels  
**Scope**: Complete REST API Endpoint Inventory (Render Web Service)  
**Date**: July 20, 2026  

---

## 1. Public & Infrastructure Endpoints

| Method | Endpoint | Auth | App Check | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/health` | None | None | Lightweight Render liveness check |
| `GET` | `/ready` | None | None | Firebase Admin & Firestore readiness check |
| `GET` | `/api/v1/health` | None | None | Legacy health check alias |
| `GET` | `/api/v1/ready` | None | None | Legacy readiness check alias |
| `POST` | `/api/v1/orders/create` | Optional | Required | Create authoritative order |
| `POST` | `/api/v1/orders/guest-lookup` | None | Required | Guest order lookup by ID + secret |
| `POST` | `/api/v1/messages` | None | Required | Submit contact message |
| `POST` | `/api/v1/reviews` | Optional | Required | Submit customer review |

---

## 2. Protected Admin Endpoints

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard-summary` | `order_manager` | Real-time operational metrics |
| `POST` | `/api/v1/admin/products` | `catalog_manager` | Create product |
| `POST` | `/api/v1/admin/products/:id/archive` | `catalog_manager` | Archive product |
| `PATCH` | `/api/v1/admin/products/:id/stock` | `catalog_manager` | Adjust stock |
| `POST` | `/api/v1/admin/orders/:id/transition` | `order_manager` | Order status transition |
| `POST` | `/api/v1/admin/messages/:id/status` | `support_manager` | Update message status |
| `POST` | `/api/v1/admin/reviews/:id/moderate` | `review_moderator` | Moderate review |
| `GET` | `/api/v1/admin/audit-events` | `owner` | Read-only audit log viewer |

---

## 3. Marketplace Endpoints (Feature-Gated — NOT ACTIVE)

| Method | Endpoint | Required Role | Status |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/admin/marketplace/channels/:id/enable` | `owner` | **DISABLED** |
| `POST` | `/api/v1/admin/marketplace/channels/:id/disable` | `owner` | **DISABLED** |
| `GET` | `/api/v1/admin/marketplace/channels/:id/health` | `owner` | **DISABLED** |
| `POST` | `/api/v1/admin/marketplace/listings/sync` | `catalog_manager` | **DISABLED** |
| `POST` | `/api/v1/admin/marketplace/inventory/sync` | `catalog_manager` | **DISABLED** |
| `GET` | `/api/v1/admin/marketplace/orders` | `order_manager` | **DISABLED** |
| `GET` | `/api/v1/admin/marketplace/settlements` | `owner` | **DISABLED** |

> [!WARNING]
> All marketplace endpoints are behind disabled feature flags. No live API calls, credential storage, listing creation, or order imports occur until the owner explicitly enables a connector.

---
*End of API Inventory.*
