# LOGGING AND REDACTION STANDARD

**Project**: Satwik Sweets and Pickels  
**Scope**: Structured JSON Logging, Correlation IDs & PII Redaction Rules  
**Date**: July 19, 2026  

---

## 1. Structured Logging Standard

All backend logs output structured JSON via `functions/src/utils/logger.ts`:
```json
{
  "severity": "INFO",
  "message": "Authoritative order processed successfully",
  "orderId": "doc_123456",
  "userId": "cust_777",
  "total": 548,
  "timestamp": "2026-07-19T10:20:00.000Z"
}
```

---

## 2. Redaction Rules

1. **Excluded Sensitive Data**: Passwords, ID tokens, App Check tokens, guest access secrets, and credit card / UPI credentials must **NEVER** be logged.
2. **PII Masking**: Customer phone numbers and addresses are excluded from general server logs.
3. **Clean Errors**: Error logs include application error codes (`AppError`) and generic messages. Stack traces and internal filesystem paths are omitted from client responses.

---
*End of Logging and Redaction Standard.*
