# ADMIN PRIVACY AND AUDIT GUIDE

**Project**: Satwik Sweets and Pickels  
**Scope**: Customer Data Minimization & Append-Only Audit Trail Operations  
**Date**: July 19, 2026  

---

## 1. Customer PII Display Minimization

To protect customer privacy:
- Customer phone numbers and addresses are masked in administrative list views.
- Full delivery details are revealed only when inspecting an individual order detail view.
- Passwords, ID tokens, and guest secrets are **never** logged or stored in audit records.

---

## 2. Audit Trail System (`/audit_logs`)

All administrative actions execute `logAuditEvent()` writing to `/audit_logs`:
- **Structure**: `{ action, actorUid, targetRef, outcome, ip, timestamp }`
- **Security Guard**: Append-only by Admin SDK backend. Browser client `create`, `update`, and `delete` operations are strictly **DENIED** by Firestore Security Rules.

---
*End of Admin Privacy and Audit Guide.*
