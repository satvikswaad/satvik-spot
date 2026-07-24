# Admin API Authorization Matrix

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Complete Authorization Policy for All Express Backend API Endpoints  

---

## 1. Comprehensive Route Authorization Matrix

| Endpoint Path | HTTP Method | Required Auth? | Required Role | Required Claims | Recent Auth Req? (`auth_time`) | MFA Req? | Rate Limit Category | Audit Log Event | Failure Response Code | Data Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /health` | `GET` | No | Public | None | No | No | Exempt | None | 200 OK | Public Status |
| `GET /ready` | `GET` | No | Public | None | No | No | Exempt | None | 503 if DB down | Dependency Status |
| `POST /api/v1/orders/create` | `POST` | Optional | `customer` | None | No | No | 100/15min | `ORDER_CREATED` | 503 (Gate `false`) | Order Details |
| `POST /api/v1/orders/guest-lookup` | `POST` | No | Public | None | No | No | 100/15min | `GUEST_LOOKUP` | 400 Bad Request | Masked Order Summary |
| `POST /api/v1/messages` | `POST` | No | Public | None | No | No | 100/15min | `MESSAGE_CREATED`| 400 Bad Request | Customer Inquiry |
| `POST /api/v1/reviews` | `POST` | No | Public | None | No | No | 100/15min | `REVIEW_SUBMITTED`| 400 Bad Request | Pending Review |
| `POST /api/v1/payments/process` | `POST` | No | Any | None | No | No | 100/15min | `PAYMENT_ATTEMPT`| 503 Payments Gate | 503 Error Payload |
| `GET /api/v1/admin/dashboard-summary` | `GET` | **Yes** | `admin_owner` | `admin: true` | No | Yes (Staging) | 100/15min | `ADMIN_DASHBOARD` | 401 / 403 | Admin Metrics |
| `POST /api/v1/admin/products` | `POST` | **Yes** | `admin_owner` | `admin: true` | No | Yes (Staging) | 100/15min | `PRODUCT_CREATED` | 401 / 403 | Catalog Data |
| `POST /api/v1/admin/products/:id/archive`| `POST` | **Yes** | `admin_owner` | `admin: true` | **Yes (15 min)** | Yes (Staging) | 100/15min | `PRODUCT_ARCHIVED`| 401 / 403 / 428 | Catalog Status |
| `PATCH /api/v1/admin/products/:id/stock` | `PATCH` | **Yes** | `admin_owner` | `admin: true` | No | Yes (Staging) | 100/15min | `STOCK_UPDATED` | 401 / 403 | Inventory Counts |
| `POST /api/v1/admin/orders/:id/transition`| `POST` | **Yes** | `admin_owner` | `admin: true` | **Yes (15 min)** | Yes (Staging) | 100/15min | `ORDER_TRANSITION`| 401 / 403 / 428 | Order Ledger |
| `POST /api/v1/admin/messages/:id/status` | `POST` | **Yes** | `admin_owner` | `admin: true` | No | Yes (Staging) | 100/15min | `MESSAGE_STATUS` | 401 / 403 | Customer Inquiry |
| `POST /api/v1/admin/reviews/:id/moderate`| `POST` | **Yes** | `admin_owner` | `admin: true` | No | Yes (Staging) | 100/15min | `REVIEW_MODERATED`| 401 / 403 | Customer Reviews |
| `GET /api/v1/admin/audit-events` | `GET` | **Yes** | `admin_owner` | `admin: true` | **Yes (15 min)** | Yes (Staging) | 100/15min | `AUDIT_LOG_VIEWED`| 401 / 403 / 428 | Security Audit Logs |
