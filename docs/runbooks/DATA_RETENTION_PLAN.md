# DATA PRIVACY AND RETENTION PLAN

**Project**: Satwik Sweets and Pickels  
**Scope**: Data Minimization, Privacy Safeguards & Collection Retention Timelines  
**Date**: July 19, 2026  

---

## 1. Data Minimization Principles

1. **No Sensitive PII Exposure**: Phone numbers, delivery addresses, and customer emails are **never** exposed in public query responses or client-side global variables.
2. **Secret Privacy**: Guest order access secrets are hashed with SHA-256 before storage. Plain secrets are never written to Firestore, logs, URLs, or analytics trackers.
3. **Internal Log Hygiene**: Audit logs and rate-limit records contain pseudonymized/hashed IP identifiers and actor UIDs. Passwords and ID tokens are strictly excluded from logging statements.

---

## 2. Collection Retention & TTL Schedule

| Collection Path | Recommended Retention Period | Data Classification | Deletion / Archive Policy |
| :--- | :--- | :--- | :--- |
| **`/orders`** | 7 Years (Financial Compliance) | Confidential Customer Data | Archived after 7 years for tax/accounting requirements. Never auto-purged without legal review. |
| **`/messages`** | 90 Days after Resolution | Internal Customer Communication | Messages in status `resolved` auto-purged after 90 days. |
| **`/reviews`** | Indefinite (Public Content) | Public UGC | Published reviews retained indefinitely. Unapproved spam reviews purged after 30 days. |
| **`/audit_logs`** | 1 Year | Security Compliance Log | Writable only by backend Admin SDK. Rotated and archived annually. |
| **`/rate_limits`** | 2 Hours (TTL) | Temporary Security State | Rate limit bucket documents deleted automatically after window expiration (TTL rule). |
| **`/idempotency`** | 24 Hours (TTL) | Temporary Request State | Idempotency records deleted 24 hours after creation via TTL policy. |

---
*End of Data Privacy and Retention Plan.*
