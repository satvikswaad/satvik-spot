# Satvik Swaad Remediation Progress Tracker (docs/PROGRESS.md)

> **Branch**: `staging`  
> **Base Commit**: `2f9578b` (`before-remediation`)  
> **Current Status**: In Progress — Wave A: Containment Initiated  

---

## Ticket Execution Board

| Ticket | Wave | Role | Status | Evidence / Test Name | Verified By | Notes |
| :--- | :---: | :--- | :---: | :--- | :--- | :--- |
| **T-009** | A | QA | Verified | `npm run verify:spec`, `npm run scan:banned`, `npm run scan:collections`, `npm run scan:secrets` | QA Scripts & CI | All 4 verification scripts operational |
| **T-010** | A | Database | Verified | `firestore.rules:58-76`, `functions/tests/firestoreRules.spec.ts:176-218` | Emulator Rules | Temporary users/customers rules patch with 14-day expiry comment |
| **T-011** | A | Storefront | Verified | `public/site/script.js:219-224` | Static Inspection | Direct Firestore write removed, set to coming soon notice |
| **T-012** | A | Payments | Verified | `STATE-5, 4.3: CANCELLED order cannot be revived on payment - sets REFUND_PENDING with PAYMENT_AFTER_CANCEL` | `backend/tests/paymentsSettlement.spec.ts:262-293` | Terminal state CANCELLED preserved; REFUND_PENDING recorded |
| **T-013** | A | Orders | Verified | `AUTH-2: Rejects mismatched userId with HTTP 404 (NEVER 403)`, `AUTH-3: Rejects invalid guest token with HTTP 404 (NEVER 403)` | `backend/tests/securityAuth.spec.ts:87-111` | timingSafeEqual comparison & 404 status code enforced |
| **T-014** | A | Security | Verified | `ARCH-6: Direct request to origin without X-Origin-Auth receives HTTP 403`, `ARCH-6: Rejects request missing X-Origin-Auth with HTTP 403` | `backend/tests/securityAuth.spec.ts:13-36`, `backend/tests/securityAttackSuite.spec.ts:182-187` | originGateMiddleware mounted on /api; startup key check; checkRevoked enabled |
| **T-015** | B | Architect | Pending | - | - | Spec v2.6, single shared source, transition() in transaction |
| **T-016** | C | Orders | Pending | - | - | Quotes API, priceOrder wiring, paise enforcement, MONEY-6 |
| **T-017** | C | Orders | Pending | - | - | DISC-2..5 redemption transactions & limits |
| **T-018** | C | Orders | Pending | - | - | Public catalog stock concealment & batch fields |
| **T-019** | C | Security | Pending | - | - | Rate limiter Firestore store, Cloudflare Access JWT |
| **T-020** | C | Security | Pending | - | - | Public/Admin server split, Dockerfile, Report-Only CSP |
| **T-021** | C | Database | Pending | - | - | Collection cleanup, daily stats transaction, INV-1..9 |
| **T-022** | D | Payments | Pending | - | - | settlePayuPayment wiring, webhook, reconciliation, vectors |
| **T-023** | D | Orders | Pending | - | - | Expiry job, redemption release, job auth |
| **T-024** | D | Admin | Pending | - | - | Admin transitions, refund flow D7, step-up |
| **T-025** | D | Admin | Pending | - | - | POS sellNow wiring, shifts, invoice counter |
| **T-026** | D | Admin | Pending | - | - | Audit hash chain, role grants, kill switches |
| **T-027** | E | Storefront | Pending | - | - | Remove Firestore client SDK from storefront |
| **T-028** | E | Storefront | Pending | - | - | Remove innerHTML, inline scripts/styles, selectors.md |
| **T-029** | E | Orders/Sec | Pending | - | - | Newsletter API implementation |
| **T-030** | E | Storefront | Pending | - | - | Newsletter UI with Turnstile & consent |
| **T-031** | E | Admin | Pending | - | - | Admin UI SDK removal, XSS elimination, pagination |
| **T-032** | F | Security | Pending | - | - | Enforce CSP headers |
| **T-033** | F | Database | Pending | - | - | Final deny-all in rules + emulator test |
| **T-034** | F | QA | Pending | - | - | Attack suite 1-37 on live Express routes |
| **T-035** | F | QA | Pending | - | - | CI gates, Lighthouse, i18n parity |
| **T-036** | F | QA | Pending | - | - | Full independent re-audit QA_REPORT_V2.md |
