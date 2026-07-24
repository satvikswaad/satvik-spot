# CORS Policy and Route Security Matrix

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Express Server CORS Configuration & Route Security Classification  

---

## 1. CORS Policy Specification

- **Matching Strategy**: Exact string equality against `envConfig.corsAllowedOrigins` array.
- **Suffix/Prefix Vulnerability Protection**: Immune to subdomain/suffix trickery (e.g., `satvik-spot-staging.web.app.attacker.com` is strictly rejected).
- **Production Restrictions**: In `production`, all `localhost` and `127.0.0.1` origins are filtered out at server initialization.
- **No-Origin Handling**: Requests without an `Origin` header (e.g., curl, Render load balancer health pings, server-to-server) pass CORS middleware without setting `Access-Control-Allow-Origin`. They must still satisfy route-level authentication, rate-limiting, and payload validation.
- **Allowed HTTP Methods**: `GET, POST, PATCH, DELETE, OPTIONS`
- **Allowed Headers**: `Authorization, X-Firebase-AppCheck, Content-Type`
- **Preflight Cache (Max-Age)**: `86400` seconds (24 hours)

---

## 2. Comprehensive API Route Security Matrix

| Endpoint Path | HTTP Methods | Access Level | Authentication Required? | Authorization Required? | Expected Browser Origin | No-Origin Access Permitted? | Rate Limit Category | Sensitive Response Data? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /health` | `GET` | Public | No | None | Any / None | **Yes** (Load Balancer) | Exempt | No (Minimal status only) |
| `GET /ready` | `GET` | Public | No | None | Any / None | **Yes** (Load Balancer) | Exempt | No (Status & DB ping only) |
| `POST /api/v1/orders/create` | `POST` | Public / Customer | Optional | Commerce Gate (`false`) | Customer Origin | Yes (With rate limit) | 100 req / 15 min | No (Order ID & Total only) |
| `POST /api/v1/orders/guest-lookup` | `POST` | Public / Customer | No | Phone/Order Sanitization | Customer Origin | Yes (With rate limit) | 100 req / 15 min | Masked Order Summary |
| `POST /api/v1/messages` | `POST` | Public / Customer | No | Input Validation | Customer Origin | Yes (With rate limit) | 100 req / 15 min | No (Success message only) |
| `POST /api/v1/reviews` | `POST` | Public / Customer | No | Forced `approved: false` | Customer Origin | Yes (With rate limit) | 100 req / 15 min | No (Pending status only) |
| `POST /api/v1/payments/process` | `POST` | Protected | Yes | Server Gate (`false`) | Customer Origin | No | 100 req / 15 min | No (503 Error) |
| `GET /api/v1/admin/dashboard-summary` | `GET` | Admin | Firebase ID Token | `admin: true` Custom Claim | Admin Origin | No | 100 req / 15 min | Yes (System Metrics) |
| `POST /api/v1/admin/products` | `POST` | Admin | Firebase ID Token | `admin: true` Custom Claim | Admin Origin | No | 100 req / 15 min | Product details |
| `POST /api/v1/admin/products/:id/archive`| `POST` | Admin | Firebase ID Token | `admin: true` Custom Claim | Admin Origin | No | 100 req / 15 min | Product status |
| `PATCH /api/v1/admin/products/:id/stock` | `PATCH` | Admin | Firebase ID Token | `admin: true` Custom Claim | Admin Origin | No | 100 req / 15 min | Inventory counts |
| `POST /api/v1/admin/orders/:id/transition`| `POST` | Admin | Firebase ID Token | `admin: true` Custom Claim | Admin Origin | No | 100 req / 15 min | Order transitions |
| `POST /api/v1/admin/messages/:id/status` | `POST` | Admin | Firebase ID Token | `admin: true` Custom Claim | Admin Origin | No | 100 req / 15 min | Message status |
| `POST /api/v1/admin/reviews/:id/moderate`| `POST` | Admin | Firebase ID Token | `admin: true` Custom Claim | Admin Origin | No | 100 req / 15 min | Review moderation |
| `GET /api/v1/admin/audit-events` | `GET` | Admin | Firebase ID Token | `admin: true` Custom Claim | Admin Origin | No | 100 req / 15 min | Audit Logs |
