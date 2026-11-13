# Pre-Approved Owner Decisions (docs/DECISIONS.md)

Recorded verbatim from Owner Directive on 2026-11-13:

1. **D1 Backend**: Always-on backend: Cloud Run (min 1 instance) or Render paid. Code host-agnostic, with Dockerfile.
2. **D3 Manual UPI**: OFF by default (flag `upiManualEnabled=false`).
3. **D4 Admin MFA**: Cloudflare Access + Google 2-Step. Admin service verifies the `Cf-Access-Jwt-Assertion` JWT (new rule AUTH-11).
4. **D6 Messages**: Email first.
5. **D7 Refunds**: Done in gateway dashboard by owner; system records `REFUND_PENDING`, then admin marks refunded with the gateway refund ID (step-up, second approval per REFUND-3).
6. **D8 Claim Window**: 48 hours.
7. **D9 Rate-Limit Store**: Firestore counters in collection `rateLimits` with TTL (Redis later).
8. **Newsletter**: Kept: API only, Turnstile, rate limit, consent field, collection `newsletterSubscribers`.
9. **Test Ownership**: Each role writes tests for its own paths in `backend/tests/<area>/`; QA owns the attack suite, rules emulator tests, invariant tests, CI, and independent review.
10. **Headers Ownership**: All `_headers` and header config belong to Security and Auth.
11. **Path Ownership**: `backend/src/products/**` belongs to Orders; `backend/src/db/**` and the invariant job belong to Database; `backend/src/config/**` belongs to Security.
12. **Collection Mapping & Merges**:
    - `inventory_logs` -> `stockMovements`
    - `payment_transactions` and `paymentAuditLog` -> `payments` and `audit_logs`
    - `messages` -> `contactMessages`
    - `customers` and `addresses` -> `users`
    - `offline_finances` -> `orders` (channel: `offline`) plus `shifts`
    - `_health` must not write to Firestore.
13. **New Approved Collections**: `rateLimits`, `idempotencyKeys`, `newsletterSubscribers`, `shifts`.
14. **DB-1 Migration Strategy**: Phased migration: build API, migrate screen by screen, then deny-all; until then, a TEMPORARY users rules patch with a 14-day expiry comment.
15. **CSP Strategy**: Starts as `Content-Security-Policy-Report-Only` and becomes enforcing only when the banned-pattern scan shows zero hits.
16. **Quote TTL**: 10 minutes.
17. **Pincode Lists**: Come from `config/deliveryZones` only.
18. **Tax & HSN**: Tax rate and HSN come from the variant; a product cannot be activated without them.
