# Satvik Swaad Remediation Tickets (docs/TICKETS.md)

## Wave A: Containment
| ID | Role | Description | Rules |
| :--- | :--- | :--- | :--- |
| **T-009** | QA | Scripts: spec hash check, banned-pattern scan (baseline count), collection-name scan vs approved list, secret scan, CI file | DOC, AGENT-8 |
| **T-010** | Database | Temporary `users`/`customers` rules patch (own doc, field whitelist, role fields blocked) + emulator test | DB-1, AUTH-4 |
| **T-011** | Storefront | Direct Firestore writes from newsletter blocked; form replaced with "coming soon" | DB-1 |
| **T-012** | Payments | CANCELLED order cannot be revived, `REFUND_PENDING` with reason `PAYMENT_AFTER_CANCEL` | STATE-5, 4.3 |
| **T-013** | Orders | Guest lookup: HTTP 404 + `crypto.timingSafeEqual` comparison | AUTH-2, AUTH-3 |
| **T-014** | Security | Origin gate mount (env flag), startup test/live key check, `checkRevoked` enabled | ARCH-6, PAY-11, AUTH-1 |

---

## Wave B: Foundation
| ID | Role | Description | Rules |
| :--- | :--- | :--- | :--- |
| **T-015** | Architect | Spec v2.6 amendments + new hash; remove duplicate `backend/src/shared` (single source of truth in root `shared/`); implement `transition()` inside Firestore transaction with compare-and-set + `orders/{id}/events`; table-driven test for legal/illegal transitions | STATE-1..6 |

---

## Wave C: Wiring (Parallel)
| ID | Role | Description | Rules |
| :--- | :--- | :--- | :--- |
| **T-016** | Orders | Mount `/api/quotes` (TTL 10 min); wire `priceOrder` into live checkout; enforce paise fields; read zones from config; use inventory reservations; mount MONEY-6 payload validation | MONEY-1, MONEY-2, MONEY-6, PRICE-1..9, STOCK-1 |
| **T-017** | Orders | Implement DISC-2..5 (atomic redemptions inside order transaction, release on cancel/expiry, per-user limits, guest validation, discount attempt rate limiter) | DISC-2..5 |
| **T-018** | Orders | Public catalog API returning `inStock`/`lowStock` instead of exact counts; STOCK-5 restock triage workflow; STOCK-7 batch & best-before recall fields | STOCK-2, STOCK-5, STOCK-7 |
| **T-019** | Security | Rate limiter (per-user, backed by `rateLimits` collection with TTL, remove test bypass); Turnstile CAPTCHA; App Check; token revocation on logout; 30-min idle timeout; Cloudflare Access assertion validation (AUTH-11) | ARCH-5, AUTH-7, AUTH-8, AUTH-9, AUTH-11 |
| **T-020** | Security | Split backend into `server-public.ts` and `server-admin.ts`; create Dockerfile; configure Report-Only CSP headers for store and admin | ARCH-2, ARCH-6, FE-1 |
| **T-021** | Database | Collections cleanup (rules & indexes); write `stats_daily` in order commit transaction; wire invariant verification job (INV-1..9) against live Firestore | DB-1, DB-5..7, INV-1..9 |

---

## Wave D: Payments, Jobs, Admin Backend
| ID | Role | Description | Rules |
| :--- | :--- | :--- | :--- |
| **T-022** | Payments | Wire callback to `settlePayuPayment`; process webhooks; build payment reconciliation job; add PayU official sample test vectors (PAY-1); complete late payment 4.3 handling; wire Razorpay raw-body webhook; fix Attack #11 | PAY-1..11, RZP-1..5 |
| **T-023** | Orders | Background order expiry job (gateway status check first); discount redemption release; service-to-service job authentication (AUTH-10) | ARCH-8, AUTH-10, DISC-3 |
| **T-024** | Admin | Admin order transitions routed through `transition()`; implement refund flow D7 (`REFUND_PENDING` -> mark refunded with gateway refund ID); enforce step-up authentication | REFUND-1..5, STATE-6 |
| **T-025** | Admin | POS endpoint wiring (`sellNow` + `priceOrder`); manage cash drawer `shifts`; sequential tax invoice counter; credit note issuance on void | POS-1..8, TAX-3 |
| **T-026** | Admin | Cryptographic audit log hash chain (LOG-2/3); role grants; emergency kill switches; price-change audit logging | LOG-1..4, ADMINPRICE-1..3 |

---

## Wave E: Frontend (Storefront & Admin Parallel)
| ID | Role | Description | Rules |
| :--- | :--- | :--- | :--- |
| **T-027** | Storefront | Remove direct Firestore Client SDK from customer storefront; route all customer profile & order history via Express API client | DB-1, AUTH-4 |
| **T-028** | Storefront | Eliminate `innerHTML`, inline scripts, styles, and `onclick` attributes using DOM `h()` helper; create i18n parity check script; document `docs/selectors.md`; load products via API instead of `productsData.js` | FE-1, FE-2, XSS-1..4 |
| **T-029** | Orders + Security | Implement `/api/v1/newsletter/subscribe` endpoint with Turnstile verification, rate limiting, consent validation, and `newsletterSubscribers` collection | D6, Newsletter |
| **T-030** | Storefront | Connect newsletter UI form to API with Turnstile and explicit consent checkbox | D6, Newsletter |
| **T-031** | Admin | Remove Firestore Client SDK from Admin UI; eliminate `innerHTML` and `document.write`; implement UI-1..7; add CSV injection safety; enforce 50-item pagination; secure bulk email tool | UI-1..7, XSS-1..4 |

---

## Wave F: Lockdown
| ID | Role | Description | Rules |
| :--- | :--- | :--- | :--- |
| **T-032** | Security | Enforce strict Content-Security-Policy (Storefront and Admin) once banned-pattern scan shows zero violations | FE-1, CSP |
| **T-033** | Database | Enforce final strict deny-all in `firestore.rules`; remove temporary patch; run full collection emulator tests | DB-1 |
| **T-034** | QA | Execute automated attack suite (Attacks 1-37) against real Express endpoints with mutation proofs for all tests | Section 16.3 #1..37 |
| **T-035** | QA | CI pipeline gates (Section 16.4); Lighthouse performance & accessibility audits; i18n key parity checks | Section 16.4 |
| **T-036** | QA | Complete independent re-audit and publish `docs/QA_REPORT_V2.md` | Final Sign-off |
