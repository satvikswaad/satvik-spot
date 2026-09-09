# Recent Authentication Policy

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: High-Security Operations & Token Freshness Enforcement  

---

## 1. Policy Overview

To prevent session hijacking or stale token misuse during administrative actions, sensitive API endpoints enforce a **15-minute maximum authentication age limit** (`maxAgeSeconds = 900`).

---

## 2. Protected Endpoint Classification

| Endpoint Path | Method | Action Description | Max Auth Age Allowed | Enforcement Mechanism | Failure Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /api/v1/admin/products/:id/archive` | `POST` | Archiving catalog products | 15 Minutes (900s) | `requireRecentAuthentication(900)` | 428 REAUTHENTICATION_REQUIRED |
| `POST /api/v1/admin/orders/:id/transition`| `POST` | Mutating order state | 15 Minutes (900s) | `requireRecentAuthentication(900)` | 428 REAUTHENTICATION_REQUIRED |
| `GET /api/v1/admin/audit-events` | `GET` | Viewing system audit logs | 15 Minutes (900s) | `requireRecentAuthentication(900)` | 428 REAUTHENTICATION_REQUIRED |

---

## 3. Server Evaluation & Response

- **Timestamp Source**: Evaluated against `decoded.auth_time` issued by Firebase Authentication during the initial password/MFA challenge.
- **Client Flag Rejection**: Client-provided timestamps or "recentlyAuthenticated" body fields are ignored.
- **Response Format**:
  ```json
  {
    "success": false,
    "error": {
      "code": "REAUTHENTICATION_REQUIRED",
      "message": "Recent authentication required. Authentication age exceeds limit (900s)."
    }
  }
  ```
