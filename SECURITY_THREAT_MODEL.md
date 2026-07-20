# SECURITY THREAT MODEL (PHASE 9 — COMPLETE)

**Project**: Satwik Sweets and Pickels  
**Scope**: Complete Threat Landscape Including Marketplace Integration  
**Date**: July 19, 2026  

---

## 1. Core Platform Threats (Phases 1–8)

| Threat | Severity | Mitigation | Status |
| :--- | :---: | :--- | :--- |
| **Unauthorized Order Data Access** | Critical | Customer isolation via `userId == request.auth.uid` in Firestore Rules | ✅ Mitigated |
| **Admin Privilege Escalation** | Critical | `admin: true` custom claim + role-based `checkPermission()` | ✅ Mitigated |
| **Price Manipulation** | High | Server-authoritative pricing in `orderService.ts` transaction | ✅ Mitigated |
| **XSS via User Content** | High | Zero `innerHTML` concatenation; `textContent` + `createElement` | ✅ Mitigated |
| **CSRF** | High | Strict CSP + App Check token verification | ✅ Mitigated |
| **Guest Secret Enumeration** | High | 64-char hex secret, SHA-256 hashed in Firestore | ✅ Mitigated |
| **Brute-Force Login** | Medium | Distributed rate limiting + Firebase Auth built-in throttling | ✅ Mitigated |
| **Admin Session Hijacking** | Medium | `browserSessionPersistence` + 15-min inactivity timeout | ✅ Mitigated |
| **Hardcoded Credentials** | Critical | Eliminated in Phase 2. Preflight script detects any regression. | ✅ Mitigated |

---

## 2. Marketplace-Specific Threats (Phase 9)

| Threat | Severity | Mitigation | Status |
| :--- | :---: | :--- | :--- |
| **Marketplace Credential Exposure** | Critical | Tokens stored exclusively in Secret Manager. Never in Firestore, frontend, or Git. | ✅ Mitigated by Design |
| **Overselling Across Channels** | High | Centralized inventory ledger + safety buffer + transactional deductions | ✅ Mitigated by Design |
| **Duplicate Order Import** | High | Idempotency/deduplication keys on all marketplace events | ✅ Mitigated by Design |
| **Unauthorized Connector Enable** | High | Only `owner` role can enable/disable marketplace connectors | ✅ Mitigated by Design |
| **Buyer PII Leakage** | High | Log redaction rules; PII excluded from general logs; retention expiry | ✅ Mitigated by Design |
| **CSV Formula Injection** | Medium | Cell values starting with `=`, `+`, `-`, `@` are prefixed with `'` | ✅ Mitigated by Design |
| **Unknown Marketplace Status** | Medium | Unmapped statuses enter `manual_review` — never guessed or auto-actioned | ✅ Mitigated by Design |
| **Returned Damaged Food** | Medium | `return_damaged` type never auto-returns to sellable inventory | ✅ Mitigated by Design |

---
*End of Security Threat Model.*
