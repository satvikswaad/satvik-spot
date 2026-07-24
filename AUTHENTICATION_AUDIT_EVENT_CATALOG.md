# Authentication Audit Event Catalog

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Structured Security Audit Events & Redaction Policy  

---

## 1. Audit Event Schema

Audit events are written to the append-only Cloud Firestore `/audit_logs` collection by the backend Admin SDK.

```typescript
interface AuditEvent {
  action: string;             // e.g. "ADMIN_LOGIN_SUCCESS", "ADMIN_DENIED"
  actorUid: string;           // Redacted UID or "UNAUTHENTICATED"
  targetRef?: string;         // Target resource ID or path
  outcome: 'SUCCESS' | 'DENIED' | 'FAILED';
  ip: string;                 // Derived client IP (sanitized)
  timestamp: FieldValue;      // Server timestamp
}
```

---

## 2. Catalog of Security Audit Events

| Event Name | Trigger Condition | Actor | Redaction Rules |
| :--- | :--- | :--- | :--- |
| `ADMIN_LOGIN_SUCCESS` | Verified ID token login to Admin Portal | `user.uid` | Passwords & raw tokens NEVER logged |
| `ADMIN_LOGIN_FAILURE` | Invalid email/password attempt | `"UNAUTHENTICATED"` | Email sanitized; password omitted |
| `ADMIN_DENIED` | Customer token attempt on admin API | `user.uid` | Bearer token header omitted |
| `REAUTHENTICATION_REQUIRED`| Auth age > 15 minutes on sensitive route | `user.uid` | Auth timestamp logged as age in seconds |
| `SESSIONS_REVOKED` | Refresh tokens terminated via CLI | Target `uid` | Service key paths redacted |
| `ADMIN_OWNER_GRANTED` | Owner claim granted via CLI | Target `uid` | Service key paths redacted |
| `ADMIN_REVOKED` | Admin claim removed via CLI | Target `uid` | Service key paths redacted |

---

## 3. Redaction and Log Protection Rules

1. **Zero Password Logging**: Raw passwords or hashes are never passed to audit loggers.
2. **Zero Raw Token Logging**: Authorization Bearer headers and raw Firebase ID tokens are omitted.
3. **Client Write Blocked**: Firestore Security Rules block client SDK writes (`allow create, update, delete: if false;`).
