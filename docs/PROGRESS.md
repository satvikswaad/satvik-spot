# Satvik Swaad Remediation Progress Tracker (docs/PROGRESS.md)

> **Branch**: `staging`  
> **Base Commit**: `2f9578b` (`before-remediation`)  
> **Current Status**: Wave C Verified by Independent QA; Initiating Wave D: End-to-End Business Logic (Tickets T-022 to T-026)  

---

## Ticket Execution Board

| Ticket | Wave | Role | Status | Evidence / Test Name | Verified By | Notes |
| :--- | :---: | :--- | :---: | :--- | :--- | :--- |
| **T-009** | A | QA | Verified | `npm run verify:spec`, `npm run scan:banned`, `npm run scan:collections`, `npm run scan:secrets` | QA Scripts & CI | All 4 verification scripts operational |
| **T-010** | A | Database | Verified | `firestore.rules:58-76`, `functions/tests/firestoreRules.spec.ts:176-218` | Emulator Rules | Temporary users/customers rules patch with 14-day expiry comment |
| **T-011** | A | Storefront | Verified | `public/site/script.js:219-224` | Static Inspection | Direct Firestore write removed, set to coming soon notice |
| **T-012** | A | Payments | Verified | `STATE-5, 4.3: CANCELLED order cannot be revived on payment - sets REFUND_PENDING with PAYMENT_AFTER_CANCEL` | `backend/tests/paymentsSettlement.spec.ts:262-293` | Terminal state CANCELLED preserved; REFUND_PENDING recorded |
| **T-013** | A | Orders | Verified | `AUTH-3: Express App POST /api/v1/orders/guest-lookup rejects invalid secret with HTTP 404 (NEVER 403)`, `AUTH-3: Express App POST /api/v1/orders/submit-utr rejects invalid secret on guest order with HTTP 404` | `backend/tests/securityAuth.spec.ts:135-245` | Real Express integration tests; assertOrderOwnership wired; timingSafeEqual enforced |
| **T-014** | A | Security | Verified | `ARCH-6: Express App drops requests to /api missing X-Origin-Auth when ORIGIN_GATE_ENABLED=true`, `PAY-11: Rejects Razorpay test key in production` | `backend/tests/securityAuth.spec.ts:72-94, 260-295` | Real Express integration tests; validateStartupConfig tests; ResourceNotFoundError extends AppError |
| **T-015** | B | Architect | Verified | `STATE-1..6: Table-Driven Transitions & Canonical transition() Function (43/43 passed)`, `sharedFoundation.spec.ts:342-430` | Independent QA Review (`docs/WAVE_B_REVIEW.md`) | Spec v2.6, SHA-256 verified, transition() with compare-and-set & orders/{id}/events append-only log; BUG-B-01/02/03 resolved |
| **T-016** | C | Orders | Verified | `MONEY-6: validateQuotePayload strictly rejects client-supplied price or total with 400`, `PRICE-7, Decision D16: Express App POST /api/v1/quotes returns 10-minute TTL quote with integer paise` | Independent QA Review (`docs/WAVE_C_REVIEW.md`) | Authoritative quote API mounted on /api/v1/quotes (GET & POST), priceOrder wired into order creation, paise enforcement |
| **T-017** | C | Orders | Verified | `DISC-1: Validates active percentage discount with minSpend requirement`, `DISC-1: Validates flat rupee discount` | Independent QA Review (`docs/WAVE_C_REVIEW.md`) | Atomic discount redemptions in redemptions/{code}_{orderId}, usedCount tracking, guest phone check |
| **T-018** | C | Orders | Verified | `STOCK-2: sanitizePublicProduct masks exact stock and returns inStock / lowStock flags only`, `STOCK-2: Express App GET /api/v1/products returns public catalog with masked stock` | Independent QA Review (`docs/WAVE_C_REVIEW.md`) | Public catalog never returns exact stock; batchId & bestBeforeDate recall fields wired |
| **T-019** | C | Security | Verified | `AUTH-11: Rejects admin request with HTTP 401 when cf-access-jwt-assertion is missing and enforcement active`, `AUTH-11: Accepts valid unexpired Cloudflare Access assertion header` | Independent QA Review (`docs/WAVE_C_REVIEW.md`) | rateLimits collection with TTL, Cloudflare Access JWT validation middleware (AUTH-11, D4) |
| **T-020** | C | Security | Verified | `phase2Architecture.spec.ts`, `phaseG_securityReaudit.spec.ts` | Independent QA Review (`docs/WAVE_C_REVIEW.md`) | Split entry points, Report-Only CSP configured, multi-stage Dockerfile |
| **T-021** | C | Database | Verified | `DB-5, DB-6: formatDailyDateKey formats IST date and applySaleToDailyStats updates metrics`, `INV-4: checkInv4RefundsNotExceedPaid`, `INV-7: checkInv7NoRolesInUserDocs` | Independent QA Review (`docs/WAVE_C_REVIEW.md`) | Approved collections enforced, stats_daily atomic increments in order creation, INV-1..9 nightly checker |
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
