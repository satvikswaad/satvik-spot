# Satvik Swaad Remediation Progress Tracker (docs/PROGRESS.md)

> **Branch**: `staging`  
> **Base Commit**: `2f9578b` (`before-remediation`)  
> **Current Status**: In Progress — Wave A: Containment Initiated  

---

## Ticket Execution Board

| Ticket | Wave | Role | Status | Evidence / Test Name | Verified By | Notes |
| :--- | :---: | :--- | :---: | :--- | :--- | :--- |
| **T-009** | A | QA | In Progress | - | - | Verification scripts (spec hash, banned patterns, collection scan, secret scan, CI) |
| **T-010** | A | Database | Pending | - | - | Temporary users/customers rules patch + emulator test |
| **T-011** | A | Storefront | Pending | - | - | Block direct Firestore write from newsletter |
| **T-012** | A | Payments | Pending | - | - | CANCELLED order cannot be revived (REFUND_PENDING) |
| **T-013** | A | Orders | Pending | - | - | Guest lookup timing-safe & 404 response |
| **T-014** | A | Security | Pending | - | - | Mount origin gate, startup key check, checkRevoked |
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
