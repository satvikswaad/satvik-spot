# ADMIN PERMISSION MATRIX (PHASE 9 — COMPLETE)

**Project**: Satwik Sweets and Pickels  
**Scope**: Granular Administrative Roles & Access Permissions (Including Marketplace)  
**Date**: July 19, 2026  

---

## 1. Administrative Role Definitions

- **`owner`**: Full administrative access. Only role authorized to view audit logs, manage admin provisioning, enable/disable marketplace connectors, view settlements, and perform emergency overrides.
- **`order_manager`**: View dashboard summary, inspect orders (website + marketplace), execute status transitions, process cancellations.
- **`catalog_manager`**: Create, edit, archive products, adjust stock, trigger listing/inventory sync when marketplace is enabled.
- **`support_manager`**: Read customer contact messages, update status (`new`, `read`, `resolved`).
- **`review_moderator`**: Inspect pending customer reviews, approve or reject moderation status.

---

## 2. Role Permission Table

| Operation | `owner` | `order_manager` | `catalog_manager` | `support_manager` | `review_moderator` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Portal Entry (`admin: true`)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dashboard Summary** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Order Status Transitions** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Product CRUD & Stock** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Message Status Update** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Review Moderation** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Audit Logs Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Enable/Disable Marketplace** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Marketplace Listing Sync** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Marketplace Inventory Sync** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Marketplace Orders** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Marketplace Settlements** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Credential Management** | ✅ | ❌ | ❌ | ❌ | ❌ |

---
*End of Admin Permission Matrix.*
