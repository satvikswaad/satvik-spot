# Satvik Swaad — Independent QA & Security Audit Report

> **Auditor**: Antigravity QA and Audit Agent (Independent Reviewer)  
> **Authority**: `docs/SPEC.md` (SHA-256: `79f2294af1cb600db403d73b3a8f463bb1ef08181b2f4f7dabf4d17f05b4ee09`), `AGENTS.md`, `docs/UNDERSTANDING.md`  
> **Target Branch**: `staging` (Commit: `2f9578b`)  
> **Status**: AUDIT COMPLETE — SPECIFICATION & SECURITY VIOLATIONS DETECTED  
> **Constraint Enforcement**: Zero production code or test modified. Independence preserved.

---

## 1. Executive Summary & Audit Dashboard

This audit was conducted strictly under the role of **QA and Audit** (Section 14.1). Every claim made by the builder across Waves 1 through 4 was subjected to static analysis, repository inspection, role boundary tracing, and mutation testing in an isolated sandbox (`U:\qa-scratch`).

### Verification Counts

| Category | Claimed | Verified | Not Verified | Violated |
| :--- | :---: | :---: | :---: | :---: |
| **Money Rules (MONEY-1..6)** | 6 | 4 | 0 | 2 |
| **Order State Machine (STATE-1..6)** | 6 | 2 | 0 | 4 |
| **Pricing & Delivery (PRICE-1..9)** | 9 | 5 | 1 | 3 |
| **Discounts (DISC-1..5)** | 5 | 1 | 0 | 4 |
| **Stock & Reservations (STOCK-1..7)** | 7 | 2 | 3 | 2 |
| **Architecture & Gate (ARCH-6)** | 1 | 0 | 0 | 1 |
| **Authentication & AuthZ (AUTH-1..10)** | 10 | 1 | 6 | 3 |
| **Database Architecture (DB-1, DB-5..7)** | 4 | 3 | 0 | 1 |
| **Storefront & Headers (FE-1, FE-2)** | 2 | 0 | 1 | 1 |
| **Payments Integration (PayU / RZP)** | 3 | 1 | 0 | 2 |
| **Manual UPI Channel (UPI-1..8)** | 8 | 7 | 1 | 0 |
| **POS Counter Controls (POS-1..8)** | 8 | 4 | 4 | 0 |
| **Refund Controls (REFUND-1..5)** | 5 | 1 | 4 | 0 |
| **Price Modifications (ADMINPRICE-1..3)** | 3 | 1 | 2 | 0 |
| **UI & Admin Controls (UI-1..7)** | 7 | 1 | 5 | 1 |
| **Attack Checklist (Section 16.3 #1..37)** | 37 | 13 | 22 | 2 |
| **Data Invariants (Section 15.2 INV-1..9)** | 9 | 0 | 9 | 0 |
| **TOTALS** | **130** | **46** | **58** | **26** |

*Overall Verdict*: **FAILED AUDIT**. 26 direct specification violations identified, including 5 Critical (S0) security and money defects. 58 claims are not verified (either missing tests, disconnected from runtime routes, or tested using inert mock stubs that do not verify production systems).

---

## 2. Specification SHA-256 Verification & Merged Branch Audit

### 2.1 Specification Integrity Check
- **Command**: `Get-FileHash -Algorithm SHA256 docs/SPEC.md`
- **Recorded Hash (`docs/SPEC.sha256`)**: `79f2294af1cb600db403d73b3a8f463bb1ef08181b2f4f7dabf4d17f05b4ee09`
- **Computed Working Copy Hash**: `79f2294af1cb600db403d73b3a8f463bb1ef08181b2f4f7dabf4d17f05b4ee09`
- **Result**: **MATCH / UNTAMPERED**.

### 2.2 Merged Branches & Role Ownership Audit (Section 14.1)

| Ticket / Commit | Merged Branch | Claimed Role | Files Changed | Role Ownership Check (Section 14.1) | Flag / Boundary Violation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **T-001** (`21ea231`) | `agent/architect/T-001-shared-foundation` | Architect | `shared/**`, `docs/api/README.md`, `backend/tests/sharedFoundation.spec.ts` | Architect owns `shared/**`, `docs/api`. QA owns tests. | **FLAG**: Architect authored tests in `backend/tests/` instead of QA. |
| **T-002** (`0676419`) | `agent/orders-inventory/T-002-pricing-and-inventory` | Orders & Inventory | `backend/src/inventory/**`, `backend/src/pricing/**`, `backend/src/shared/**`, `backend/tests/ordersInventory.spec.ts` | Orders owns pricing/inventory. Architect owns `shared/**`. | **CRITICAL FLAG**: Orders & Inventory created a duplicate copy of `shared/**` inside `backend/src/shared/**`. Authoring `shared/**` belongs exclusively to Architect. |
| **T-003** (`c76d5ac`) | `agent/security-auth/T-003-security-gate-auth` | Security & Auth | `backend/src/auth/securityGateService.ts`, `backend/tests/securityAuth.spec.ts` | Security & Auth owns auth middleware. | Owned paths respected (test authoring in backend/tests). |
| **T-004** (`85d90b4`) | `agent/database/T-004-database-rules-indexes` | Database | `backend/src/db/statsDailyService.ts`, `firestore.rules`, `firestore.indexes.json`, `backend/tests/databaseInvariants.spec.ts` | Database owns rules, indexes, stats aggregation. | Owned paths respected. |
| **Direct Commit** (`b04980e`) | (Direct commit on staging) | Unknown / Unattributed | `firestore.indexes.json`, `firestore.rules` | Database owns rules and indexes. | **CRITICAL FLAG**: Bypassed ticket flow (14.2). Committed directly to staging without ticket branch or pull request. Added unapproved collections (`inventory_logs`, `payment_transactions`). |
| **T-005** (`4107e78`) | `agent/storefront/T-005-storefront-hardening-i18n` | Storefront | `public/site/_headers` | Section 14.1 explicitly assigns `Pages _headers` to **Security and Auth**. Storefront must not touch headers. | **CRITICAL FLAG**: Storefront modified `public/site/_headers`, violating Section 14.1 path ownership. |
| **T-006** (`260bc2d`) | `agent/payments/T-006-payu-razorpay-settlement` | Payments | `backend/src/payments/**`, `backend/tests/paymentsSettlement.spec.ts` | Payments owns payment services and webhooks. | Owned paths respected. |
| **T-007** (`12fceab`) | `agent/admin/T-007-admin-erp-pos` | Admin | `backend/src/admin/adminErpPosService.ts`, `backend/tests/adminErpPos.spec.ts` | Admin owns admin backend/frontend. | Owned paths respected. |
| **T-008** (`a380ae9`) | `agent/qa/T-008-security-attack-suite-and-invariants` | QA and Audit | `backend/tests/nightlyInvariants.spec.ts`, `backend/tests/securityAttackSuite.spec.ts` | QA owns test suites. | Owned paths respected. |

---

## 3. Claim-by-Claim Verification Table (Step 2)

| Rule ID / Claim | Verification Status | Evidence / Test Name & File | Detailed Assessment |
| :--- | :--- | :--- | :--- |
| **MONEY-1** | **VIOLATED** | `backend/tests/sharedFoundation.spec.ts:31-44` vs `backend/src/orders/orderService.ts:99-128` | Helper `assertPaise` is tested, but runtime order route `orderService.ts` calculates float prices (`product.price * qty`, `shippingFee = 50`) without paise integers. |
| **MONEY-2** | **VIOLATED** | `backend/src/orders/orderService.ts:111, 127-128` | Runtime orders store unadorned `unitPrice`, `lineTotal`, `shippingFee`, `total` instead of `subtotalPaise`, `shippingPaise`, `totalPaise`. |
| **MONEY-3** | **VERIFIED** | verified by `formatRupees converts paise to exact 2-decimal rupee string` in `backend/tests/sharedFoundation.spec.ts:23-29` | Strict two-decimal formatting without commas tested and verified. |
| **MONEY-4** | **VERIFIED** | verified by `createRazorpayOrderPayload preserves integer totalPaise amount` in `backend/tests/paymentsSettlement.spec.ts:88-106` | Native paise integer passed to Razorpay without rupee conversion. |
| **MONEY-5** | **VERIFIED** | verified by `roundTaxPaise rounds half-up to nearest paisa` in `backend/tests/sharedFoundation.spec.ts:46-51` | Half-up rounding helper verified. |
| **MONEY-6** | **VIOLATED** | `backend/tests/sharedFoundation.spec.ts:53-68` vs `backend/src/orders/orderController.ts:18-40` | `validateOrderCreationPayload` exists and rejects client prices, but is **never called** in runtime Express `orderController.ts`. |
| **STATE-1** | **VIOLATED** | `shared/stateMachine.ts:1-115` | Central function `transition()` was **never implemented**. Only `isValidTransition` boolean helper exists. Routes write status directly. |
| **STATE-2** | **VIOLATED** | `shared/stateMachine.ts:1-115` | No Firestore compare-and-set transaction runner implemented in `shared/stateMachine.ts`. |
| **STATE-3** | **VIOLATED** | `shared/stateMachine.ts:1-115` | Append-only write to `orders/{id}/events` is missing because `transition()` does not exist. |
| **STATE-4** | **VERIFIED** | verified by `Same-state transition is idempotent (valid no-op)` in `backend/tests/sharedFoundation.spec.ts:192-196` | Whitelist treats self-transition as valid. |
| **STATE-5** | **VIOLATED** | `backend/src/payments/payuService.ts:784-850` | `settlePayuPayment` revives `CANCELLED` orders to `CONFIRMED` upon payment arrival, directly breaking terminal status invariant. |
| **STATE-6** | **VERIFIED** | verified by `Step-Up Authentication Window (AUTH-5, STATE-6)` in `backend/tests/securityAuth.spec.ts:65-75` | 300-second freshness window enforced by `assertStepUpFreshness`. |
| **PRICE-1** | **NOT VERIFIED** | `backend/src/pricing/pricingEngine.ts:133-180` | `priceOrder` implemented in isolation, but **not imported or used** by `orderService.ts` or any checkout route. |
| **PRICE-2** | **VERIFIED** | verified by `Orders above ₹25,000 flag needsReview = true` in `backend/tests/ordersInventory.spec.ts:64-84` | Subtotal > 2,500,000 paise sets `needsReview: true`. |
| **PRICE-3** | **VERIFIED** | verified by `calculateDeliveryFeePaise` in `backend/tests/ordersInventory.spec.ts:15-28` | Delivery fee strictly checks pincode. |
| **PRICE-4** | **VERIFIED** | verified by `Non-local delivery fee is 0 for subtotal >= ₹499` in `backend/tests/ordersInventory.spec.ts:20-28` | Free non-local shipping at ₹499 net subtotal verified. |
| **PRICE-5** | **VIOLATED** | `backend/src/pricing/pricingEngine.ts:70` | Hardcodes `'274001'` in source code instead of reading `config/deliveryZones` (`freeLocal` and `serviceable`). Non-serviceable pincodes never checked. |
| **PRICE-6** | **VERIFIED** | verified by `Non-local delivery fee is 0 for subtotal >= ₹499, else ₹50` in `backend/tests/ordersInventory.spec.ts:25-28` | Standard non-local delivery fee is ₹50 (5,000 paise). |
| **PRICE-7** | **VIOLATED** | `backend/src/pricing/pricingEngine.ts:12, 168-169` | Developer mislabeled quote TTL as PRICE-7, and set quote validity to 15 minutes (`CONFIG_LIMITS.reserveOnlineMinutes`) instead of 10 minutes. |
| **PRICE-8** | **VERIFIED** | verified by `Tax calculates half-up rounded paisa per line` in `backend/tests/ordersInventory.spec.ts:30-35` | Tax calculated per line and rounded half-up. |
| **PRICE-9** | **VIOLATED** | `backend/src/pricing/pricingEngine.ts:168-169` | Quote TTL lives for 15 minutes in code instead of 10 minutes (PRICE-9). Quote endpoint `POST /api/quotes` is completely missing. |
| **DISC-1** | **VERIFIED** | verified by `Validates active percentage discount with minSpend requirement` in `backend/tests/ordersInventory.spec.ts:88-125` | `PERCENT` and `FLAT_PAISE` coupon math verified. |
| **DISC-2** | **VIOLATED** | `backend/src/pricing/pricingEngine.ts:51-128` | `redemptions/{code}_{orderId}` atomic creation inside order transaction is not implemented anywhere in backend. |
| **DISC-3** | **VIOLATED** | `backend/src/inventory/inventoryService.ts` | Release of redemption document on cancel or expiry is not implemented. |
| **DISC-4** | **VIOLATED** | `backend/src/pricing/pricingEngine.ts:51-60` | `guestAllowed` field, per-phone hash limits, and IP limits for guests are completely missing from schema and logic. |
| **DISC-5** | **VIOLATED** | `backend/src/rateLimiting/rateLimiter.ts:1-145` | Discount code attempt rate limiter (10 per 10 minutes) does not exist. |
| **STOCK-1** | **VIOLATED** | `backend/src/inventory/inventoryService.ts:58-124` vs `backend/src/orders/orderService.ts:121` | Transactional reservation engine exists in `inventoryService.ts`, but runtime `orderService.ts` directly deducts product stock in-place without reservations. |
| **STOCK-2** | **VIOLATED** | `public/site/js/productsData.js:42-44, 81-83` | Exact stock numbers (`stock: 50`, `stock: 35`) are exposed directly to browser in `productsData.js`. Public API filtering to `inStock`/`lowStock` is absent. |
| **STOCK-3** | **VERIFIED** | verified by `STOCK-3: Low stock warning check` in `backend/src/inventory/inventoryService.ts:164-167` | Triggers alert when onHand <= 5 units. |
| **STOCK-4** | **VERIFIED** | verified by `getReservationDurationMinutes` in `backend/src/inventory/inventoryService.ts:44-52` | Reservation duration verified: 15m online, 120m UPI/WA, 30m COD. |
| **STOCK-5** | **NOT VERIFIED** | (No test / no implementation) | Restock triage workflow forbidding automatic food restock on return is not implemented. |
| **STOCK-6** | **NOT VERIFIED** | `backend/src/inventory/inventoryService.ts:10` | Misinterpreted: Developer documented append-only ledger as STOCK-6 instead of write-rate limit / sharded counters. |
| **STOCK-7** | **NOT VERIFIED** | (No test / no implementation) | Batch codes and best-before date recall traceability are not implemented in backend or invoices. |
| **ARCH-6** | **VIOLATED** | `backend/src/auth/securityGateService.ts:59-70` vs `backend/src/app.ts:1-195` | `originGateMiddleware` is implemented in isolation and tested in unit tests, but is **never mounted in `app.ts`**. Direct traffic is not dropped. |
| **AUTH-1** | **NOT VERIFIED** | `backend/src/auth/verifyAuth.ts:186` | Firebase Auth token verification does not enforce `checkRevoked = true` in Express backend. |
| **AUTH-2** | **VIOLATED** | `backend/src/orders/orderController.ts:102` | Runtime guest lookup throws `AuthorizationError` returning HTTP 403 Forbidden instead of HTTP 404 Not Found (BOLA defense). |
| **AUTH-3** | **VIOLATED** | `backend/src/orders/orderController.ts:102`, `backend/src/orders/orderService.ts:650` | Runtime code compares guest secret hash using `!==` (strict inequality) instead of `crypto.timingSafeEqual`. |
| **AUTH-4** | **VIOLATED** | `firestore.rules:62-65, 70-74` | Rules explicitly permit client create/update on `/users/{userId}` and `/customers/{userId}` as long as `admin` is not in data, allowing direct client writes. |
| **AUTH-5** | **VERIFIED** | verified by `Accepts auth timestamp within 300 seconds` in `backend/tests/securityAuth.spec.ts:65-75` | 300-second freshness window verified. |
| **AUTH-6** | **NOT VERIFIED** | `docs/runbooks/` | Cloudflare Access configuration for admin site is not verified in code. |
| **AUTH-7** | **NOT VERIFIED** | (No test / no implementation) | 30-minute admin session idle timeout is not implemented in admin client or server. |
| **AUTH-8** | **NOT VERIFIED** | (No test / no implementation) | Admin token revocation on logout not implemented. |
| **AUTH-9** | **NOT VERIFIED** | `backend/src/app.ts` | Turnstile CAPTCHA server-side validation middleware not implemented on checkout/profile routes. |
| **AUTH-10** | **NOT VERIFIED** | (No test / no implementation) | Signed service-to-service tokens for internal scheduled cron endpoints not implemented. |
| **DB-1** | **VIOLATED** | `firestore.rules:25-46, 62-74` & `public/site/script.js:288-290` | Security rules permit client reads if `isAdmin()` and client writes to `users`. Storefront footer newsletter directly calls Firestore SDK (`addDoc`). |
| **DB-5** | **VERIFIED** | verified by `formatDailyDateKey creates standard YYYY-MM-DD key in IST` in `backend/tests/databaseInvariants.spec.ts:25-38` | IST daily date key formatting verified. |
| **DB-6** | **VERIFIED** | verified by `applySaleToDailyStats increments revenuePaise, ordersCount, and channel totals` in `backend/tests/databaseInvariants.spec.ts:40-58` | Daily stats sale aggregation verified. |
| **DB-7** | **VERIFIED** | verified by `applyRefundToDailyStats decrements revenuePaise accurately` in `backend/tests/databaseInvariants.spec.ts:60-75` | Daily stats refund decrement verified. |
| **FE-1** | **VIOLATED** | `public/site/script.js:5145`, `public/admin/admin.js:2705, 3811-3875` | 1,274 banned pattern violations in `public/`: 116 `innerHTML` usages, 1 `document.write`, 29 inline scripts, 1,119 inline styles. |
| **FE-2** | **NOT VERIFIED** | `docs/selectors.md` | Selectors contract documentation file `docs/selectors.md` does not exist. |
| **settlePayuPayment** | **VIOLATED** | `backend/src/payments/payuService.ts:661-860` vs `backend/src/payments/paymentController.ts:46` | Canonical settlement function implemented, but **disconnected from Express router** (controller calls legacy `processPayUResponse`). Revives `CANCELLED` orders. |
| **PayU Hash Verification** | **VIOLATED** | `backend/tests/paymentsSettlement.spec.ts:24-43` | Reverse hash has correct 6 pipes, but unit test creates local mock strings and recomputes the hash; no unit test uses PayU's published sample test vectors (PAY-1). |
| **Razorpay Webhook** | **VERIFIED** | verified by `verifyRazorpayWebhookSignature validates authentic HMAC signature` in `backend/tests/paymentsSettlement.spec.ts:182-205` | HMAC-SHA256 signature verification helper verified. |
| **UPI-1** | **VERIFIED** | verified by `UPI-1: Rejects manual UPI submission when upiManualEnabled flag is false` in `backend/tests/paymentsSettlement.spec.ts:210-230` | Feature gate defaults to disabled. |
| **UPI-2** | **VERIFIED** | verified by `UPI-2: Rejects orders exceeding ₹2,000 (200,000 paise)` in `backend/tests/paymentsSettlement.spec.ts:232-245` | ₹2,000 cap enforced. |
| **UPI-3** | **VERIFIED** | verified by `UPI-3: Validates 12 numeric digits and rejects collision` in `backend/tests/paymentsSettlement.spec.ts:247-265` | Exactly 12 numeric digits validated; collision rejected. |
| **UPI-4** | **VERIFIED** | verified by `UPI-4: Valid manual UPI advances paymentStatus to PENDING_VERIFICATION` in `backend/tests/paymentsSettlement.spec.ts:267-280` | Advances to `PENDING_VERIFICATION`. |
| **UPI-5** | **VERIFIED** | verified by `UPI-5: Sets reservation lifetime to 2 hours (120 minutes)` in `backend/tests/paymentsSettlement.spec.ts:282-295` | 120-minute reservation duration verified. |
| **UPI-6** | **VERIFIED** | verified by `UPI-6: Second submission of identical UTR across different orders rejected` in `backend/tests/paymentsSettlement.spec.ts:297-310` | UTR collision rejected. |
| **UPI-7** | **VERIFIED** | verified by `UPI-7: Rejects malformed UTR strings` in `backend/tests/paymentsSettlement.spec.ts:312-325` | Non-12-digit strings rejected. |
| **UPI-8** | **NOT VERIFIED** | (No test / no implementation) | Customer UI notification on UPI approval/rejection not implemented. |
| **POS-1** | **VERIFIED** | verified by `POS-1: Rejects POS sale creation if caller lacks staff or owner role` in `backend/tests/adminErpPos.spec.ts:49-60` | Staff/owner role enforcement verified. |
| **POS-2** | **NOT VERIFIED** | `backend/src/admin/adminErpPosService.ts:40-65` | Immediate stock deduction for POS sale implemented in isolated service, not mounted in runtime Express routes. |
| **POS-3** | **VERIFIED** | verified by `POS-3: Staff discount is capped at the lower of 5% and ₹100` in `backend/tests/adminErpPos.spec.ts:13-37` | 5% / ₹100 cap and owner written reason override verified. |
| **POS-4** | **VERIFIED** | verified by `TAX-3, POS-6: Formats sequential financial year invoice SS/YY-YY/XXXXXX` in `backend/tests/adminErpPos.spec.ts:39-47` | Sequential FY invoice format verified. |
| **POS-5** | **VERIFIED** | verified by `POS-5: Void requires owner role and step-up authentication` in `backend/tests/adminErpPos.spec.ts:62-84` | Void restricted to owner with active step-up. |
| **POS-6** | **NOT VERIFIED** | (No test / no implementation) | Daily cash drawer balance reconciliation not implemented. |
| **POS-7** | **NOT VERIFIED** | `backend/src/admin/adminErpPosService.ts` | POS audit logging not mounted in runtime Express routes. |
| **POS-8** | **NOT VERIFIED** | (No test / no implementation) | Credit note issuance for POS voiding not implemented. |
| **REFUND-1** | **NOT VERIFIED** | (No test / no implementation) | Gateway dashboard refund workflow not automated. |
| **REFUND-2** | **NOT VERIFIED** | (No test / no implementation) | Refund reason codes not enforced on routes. |
| **REFUND-3** | **VERIFIED** | verified by `REFUND-3: Refund > ₹2,000 requires second admin/owner approval` in `backend/tests/adminErpPos.spec.ts:88-127` | Dual approval for > ₹2,000 or 3rd refund in 24h verified. |
| **REFUND-4** | **NOT VERIFIED** | (No test / no implementation) | Gateway refund webhook confirmation not implemented. |
| **REFUND-5** | **NOT VERIFIED** | (No test / no implementation) | Partial refund capping not tested in transaction. |
| **ADMINPRICE-1** | **NOT VERIFIED** | `backend/src/admin/adminErpPosService.ts` | Catalog manager permission on route not wired. |
| **ADMINPRICE-2** | **VERIFIED** | verified by `ADMINPRICE-2: Price change > 50% requires explicit double confirmation` in `backend/tests/adminErpPos.spec.ts:131-155` | > 50% price change double confirmation verified. |
| **ADMINPRICE-3** | **NOT VERIFIED** | `backend/src/admin/adminErpPosService.ts` | Price change audit logging not mounted in runtime Express routes. |
| **UI-1** | **NOT VERIFIED** | (No test / no implementation) | Confirmation modal repeating amount/reason not tested. |
| **UI-2** | **NOT VERIFIED** | (No test / no implementation) | In-flight button disabling not tested. |
| **UI-3** | **NOT VERIFIED** | `backend/tests/adminErpPos.spec.ts:157` | Test in `adminErpPos.spec.ts:157` tests cursor pagination, not UI-3 (no optimistic updates). |
| **UI-4** | **VERIFIED** | verified by `UI-3: Paginates collection with default 25 items per view` in `backend/tests/adminErpPos.spec.ts:158-177` | Cursor pagination verified (mislabeled as UI-3, uses 25 instead of 50). |
| **UI-5** | **NOT VERIFIED** | (No test / no implementation) | Event timeline on order detail not tested. |
| **UI-6** | **NOT VERIFIED** | (No test / no implementation) | CSV export audited action not tested. |
| **UI-7** | **VIOLATED** | `public/admin/admin.js:2705, 3811-3875` | Customer text rendered via `innerHTML` and `document.write`. |
| **Attacks #1..37** | **VIOLATED** | `backend/tests/securityAttackSuite.spec.ts:1-392` | 20 out of 37 attack tests are completely missing. Attack 11 and 28 are worthless tests that pass even when security is broken. Remaining tests use mock stubs. |
| **INV-1..9** | **NOT VERIFIED** | `backend/tests/nightlyInvariants.spec.ts:1-241` | Tested only as inline local arrow functions inside test file. No scheduled job, script, or real database invariant check runner exists. |

---

## 4. Answers to the 18 Known Suspicions (Step 3)

### Question 1: Quote TTL must be 10 minutes (PRICE-9). Is it 15 anywhere?
**YES**. In `backend/src/pricing/pricingEngine.ts`:
- Line 12: `* - PRICE-7: Quote lifetime is 15 minutes.` (mislabeled rule ID and wrong duration)
- Lines 168-169:
  ```typescript
  // PRICE-7: Quote validity 15 minutes
  const quoteExpiresAt = new Date(Date.now() + CONFIG_LIMITS.reserveOnlineMinutes * 60 * 1000);
  ```
  `CONFIG_LIMITS.reserveOnlineMinutes` is 15. The quote validity is set to 15 minutes instead of 10 minutes required by PRICE-9 (`docs/SPEC.md:394`).

### Question 2: Any hard-coded pincode (for example 274001) in backend/src? Pincodes must come from config/deliveryZones (7.2, D5).
**YES**. In `backend/src/pricing/pricingEngine.ts:70`:
```typescript
if (cleanPincode === '274001') {
  return 0;
}
```
Pincode `'274001'` is hardcoded in the function body. It does not read `config/deliveryZones` (`deliveryZones.freeLocal` and `deliveryZones.serviceable`). Unserviceable pincodes are never validated or rejected.

### Question 3: Any hard-coded GST rate (12, 5, 0.12, 0.05)? Rates must come from the variant's taxRatePercent (TAX-1).
**NO**. `calculateLineTaxPaise(lineTotalPaise, item.taxRatePercent)` in `backend/src/pricing/pricingEngine.ts:86-91` correctly accepts `taxRatePercent` from the variant item. No hardcoded 12% or 5% tax multiplier is present in the pricing engine.

### Question 4: List every Firestore collection name used in code and in firestore.indexes.json that is NOT in section 11.2.
Section 11.2 approves exactly: `products`, `variants`, `inventory`, `reservations`, `stockMovements`, `orders`, `events`, `payments`, `payuTxn`, `utrIndex`, `quotes`, `discounts`, `redemptions`, `refunds`, `users`, `reviews`, `contactMessages`, `config`, `counters`, `audit_logs`, `audit_head`, `stats_daily`.

**Unlisted collections found in code and indexes (Spec Violation AGENT-2)**:
1. `inventory_logs` — in `backend/src/inventory/inventoryService.ts:224`, `firestore.indexes.json:62`, `firestore.rules:25`.
2. `payment_transactions` — in `backend/src/payments/payuService.ts`, `firestore.indexes.json:70`, `firestore.rules:31`.
3. `messages` — in `backend/src/admin/adminController.ts:258` (Spec specifies `contactMessages`).
4. `customers` — in `backend/src/customer/customerService.ts:50` and `firestore.rules:68` (Spec specifies `users`).
5. `addresses` — in `backend/src/customer/customerService.ts:16` (Spec specifies addresses stored in `users/{uid}` array).
6. `idempotency` — in `backend/src/orders/orderService.ts:196` and `firestore.rules:49`.
7. `paymentAuditLog` — in `backend/src/payments/payuService.ts:311`.
8. `rate_limits` — in `backend/src/rateLimiting/rateLimiter.ts:32` and `firestore.rules:54`.
9. `_health` — in `backend/src/routes/healthRoutes.ts:50`.
10. `newsletter_subscribers` — in `public/site/script.js:289` and `data/newsletter_subscribers.json`.
11. `offline_finances` — in `public/admin/admin.js:2010, 2169` and `public/admin/adminDataAdapter.js:2264`.

### Question 5: DISC-1..5: is FLAT_PAISE supported, are usage limits and per-user limits enforced, is redemption inside the order-creation transaction (DISC-2), is it released on expiry or cancel (DISC-3), guest limits (DISC-4), code-attempt rate limit (DISC-5)?
- **FLAT_PAISE supported**: **YES**. In `backend/src/pricing/pricingEngine.ts:123-125`.
- **Total usage limits enforced**: **YES**. In `backend/src/pricing/pricingEngine.ts:108-110`.
- **Per-user limits enforced**: **NO**. `DiscountDoc` schema has no `perUserLimit` field and `validateDiscountCode` does not accept `userId`.
- **Redemption inside order-creation transaction (DISC-2)**: **NO**. Collection `redemptions` is never read or written in `backend/src`.
- **Released on expiry or cancel (DISC-3)**: **NO**. No redemption release logic exists.
- **Guest limits (DISC-4)**: **NO**. `guestAllowed`, phone hash, and IP restrictions are completely unwritten.
- **Code-attempt rate limit (DISC-5)**: **NO**. No rate limiter exists for discount code verification.

### Question 6: STOCK-1..7: especially STOCK-2 (public API returns only inStock/lowStock, never exact quantities), STOCK-6, STOCK-7.
- **STOCK-1**: **VIOLATED AT RUNTIME**. Implemented in `inventoryService.ts`, but runtime `orderService.ts:121` directly deducts product stock in-place.
- **STOCK-2**: **VIOLATED**. Exact stock quantities (`stock: 50, 35, 20...`) are embedded in `public/site/js/productsData.js` and loaded directly into the client. No public API filters exact stock to `inStock`/`lowStock`.
- **STOCK-3**: **VERIFIED**. Low stock warning logged when available units <= 5 (`inventoryService.ts:165`).
- **STOCK-4**: **VERIFIED**. Durations (15m, 120m, 30m) implemented in `inventoryService.ts:44-52`.
- **STOCK-5**: **NOT VERIFIED**. Restock triage workflow for food returns is missing.
- **STOCK-6**: **MISINTERPRETED / NOT VERIFIED**. Developer attributed append-only ledger to STOCK-6 instead of write-rate limit / sharded counters.
- **STOCK-7**: **NOT VERIFIED**. Batch codes and recall traceability are not implemented in schema, code, or invoices.

### Question 7: STATE-2 and STATE-3: does transition() run in a Firestore transaction with compare-and-set and write orders/{id}/events? Is there a table-driven test of EVERY legal and EVERY illegal transition in sections 4.2 and 4.4?
- **Does `transition()` run in a transaction with compare-and-set and write events?**: **NO**. The function `transition()` **does not exist** in `shared/stateMachine.ts` or anywhere else. Only `isValidTransition` boolean helper exists.
- **Is there a table-driven test of EVERY transition?**: **NO**. `backend/tests/sharedFoundation.spec.ts:165-207` tests only 15 hardcoded transition pairs out of 64 order state combinations and 100 payment state combinations.

### Question 8: Rate limiting: is the counter store shared across instances, or an in-memory Map? (10.3, D9)
**Firestore counter store (not in-memory, but not Redis as selected in D9)**.
In `backend/src/rateLimiting/rateLimiter.ts:32-57`, it writes to `db.collection('rate_limits')` inside transactions. However:
1. Decision D9 chose "A free-tier Redis service", not Firestore counters.
2. `rateLimiter.ts:22-24` **bypasses rate limiting entirely** during test runs (`if (process.env.NODE_ENV === 'test') return next();`).
3. Rate limits are keyed solely by IP, never by `userId` as mandated by Section 10.3.

### Question 9: DB-1 and the newsletter: the builder says the footer newsletter box is "connected to Firestore". Does browser code call Firestore directly?
**YES (CRITICAL VIOLATION OF DB-1)**.
In `public/site/script.js:288-290`:
```javascript
import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js').then(({ collection, addDoc }) => {
    addDoc(collection(window.db, 'newsletter_subscribers'), newSubscriber).catch(() => {});
}).catch(() => {});
```
The browser client imports the Firestore Web SDK and attempts to directly write to unlisted collection `'newsletter_subscribers'`. There is no API route, no Turnstile CAPTCHA verification, and no rate limiting.

### Question 10: Does any browser code under public/ import or call the Firestore SDK?
**YES (WIDESPREAD VIOLATION OF DB-1)**:
1. `public/site/firebase-config.js:2, 23`: `import { getFirestore } ... window.db = getFirestore(app);`
2. `public/site/script.js:288-290`: Imports SDK and calls `addDoc`.
3. `public/site/script.js:2233-2234`: Calls `window.firestoreDoc` and `window.firestoreSetDoc` directly on `users`.
4. `public/admin/firebase-config.js:2, 15`: `import { getFirestore } ... window.db = getFirestore(app);`
5. `public/admin/admin.js:20, 805, 1317, 1405, 1594, 1986, 2010, 2169, 2190`: Imports SDK and directly executes `query`, `collection`, `onSnapshot`, `updateDoc`, `setDoc`, `deleteDoc` on `orders`, `products`, and unlisted `offline_finances`.
6. `public/admin/adminDataAdapter.js:37, 2039, 2143, 2208, 2264, 2290`: Directly calls Firestore SDK methods.

### Question 11: XSS-1..8: search public/ for innerHTML, outerHTML, insertAdjacentHTML, document.write, eval, new Function, inline onclick=, inline <script>, style=.
**1,274 VIOLATIONS FOUND IN `public/`**:
- `innerHTML`: **116 hits** (e.g. subscriber campaign table in `public/admin/admin.js:3811, 3836, 3852, 3869, 3875`; customer reviews marquee in `public/site/script.js:5145`).
- `document.write`: **1 hit** (`public/admin/admin.js:2705` in POS receipt generation).
- `inline <script>`: **29 hits** across HTML templates.
- `inline onclick=`: **9 hits** across HTML templates.
- `inline style=`: **1,119 hits** across storefront and admin templates.

### Question 12: Is the CSP in _headers exactly the policy in section 10.1? Is the admin site served with its own stricter CSP?
- **Storefront CSP (`public/site/_headers`)**: Mostly conforms (has `default-src 'none'`, `base-uri 'none'`, `object-src 'none'`, `frame-ancestors 'none'`, no `unsafe-inline`, no `unsafe-eval`), but is missing `https://<firebase-auth-domain>` from `frame-src`.
- **Admin CSP**: **MISSING**. No `_headers` exists in `public/admin/`. Express `app.ts:104` serves `/admin` with standard static middleware and sets no stricter admin CSP (`script-src 'self'` only, `require-trusted-types-for 'script'`).

### Question 13: PayU: does the hash code match section 5.2 exactly (six pipes after udf5 and after status)? Is there a unit test using PayU's published sample values (PAY-1)? Is timingSafeEqual used with a length check?
- **Hash pipes**: **YES**. Exactly 6 pipes after `udf5` in request hash (`payuService.ts:78`) and 6 pipes after `status` in response hash (`payuService.ts:123`).
- **Unit test with PayU published samples (PAY-1)**: **NO**. `backend/tests/paymentsSettlement.spec.ts:24-43` uses locally generated mock test strings and asserts against its own formula recomputation.
- **timingSafeEqual with length check**: **YES**. Implemented in `safeCompareHashes` (`payuService.ts:198-208`).

### Question 14: Do the webhook route and the reconciliation job exist and call the same settlePayuPayment (PAY-5, PAY-6, PAY-7)? Is the expiry job checking the gateway before releasing stock (8.5 step 2)?
- **Webhook route**: **NO**. PayU webhook route is not registered in `backend/src/app.ts`.
- **Reconciliation job**: **NO**. Does not exist in codebase.
- **`settlePayuPayment` called?**: **NO**. `settlePayuPayment` is exported in `payuService.ts` but never called by any Express route or job. Express route calls legacy `processPayUResponse`.
- **Expiry job checking gateway**: **NO**. No reservation expiry cron job exists.

### Question 15: Is the late-payment path of 4.3 implemented for both cases (stock available, stock missing) and for CANCELLED orders?
- **Stock available**: Implemented in `settlePayuPayment:785` (revives to `CONFIRMED`).
- **Stock missing**: Sets `REFUND_PENDING` with reason `LATE_PAYMENT_NO_STOCK`, but fails to record `paymentStatus = PAID` first or create a `payments` doc.
- **CANCELLED orders**: **VIOLATED (CRITICAL DEFECT)**. `settlePayuPayment:785` only checks `isExpired = order.orderStatus === 'EXPIRED'`. A `CANCELLED` order bypasses this check and is illegally revived to `CONFIRMED` (`payuService.ts:846`), directly violating Section 4.3 rule 4 and STATE-5.

### Question 16: Is the startup check that refuses test keys in prod and live keys outside prod present (PAY-11)?
**NO**. `validateStartupConfig` in `backend/src/config/environment.ts:94-180` performs environment name and CORS origin checks, but contains **zero checks** for PayU or Razorpay test vs. live key prefixes.

### Question 17: Is guest order access using a hashed token with timingSafeEqual (AUTH-3), and do all order routes return 404 on ownership mismatch?
**VIOLATED AT RUNTIME**:
- In `backend/src/orders/orderController.ts:102` and `orderService.ts:650`, guest hash is checked using `providedHash !== data.guestSecretHash` (plain strict inequality, not `timingSafeEqual`).
- It throws `AuthorizationError` returning HTTP 403 Forbidden instead of HTTP 404 Not Found.
- The isolated helper `assertOrderOwnership` in `securityGateService.ts` is never called by order routes.

### Question 18: Are there any secrets, keys or salts in the repo or git history?
- **Current files**: Firebase web client API keys (public identifiers) appear in `public/site/firebase-config.js:8`, `public/admin/firebase-config.js:6`, and `archive/legacy-admin/firebase-config.js:6`.
- **Secret scan**: No private gateway secrets, live salt strings, or production credentials were found hardcoded in current source code or git history.

---

## 5. Results of Step 4 Mutation Experiments

In accordance with Step 4, an isolated copy of the repository was created at `U:\qa-scratch\repo`. The checks protecting the 10+ core security attacks were deliberately mutated, Jest was executed against each test, and the outcome recorded:

| Item / Attack ID | Target Check | Mutation Applied | Result When Broken | Test Quality Assessment |
| :--- | :--- | :--- | :--- | :--- |
| **Attack #3** | PAY-2 Reverse hash verification in `settlePayuPayment` | Replaced hash mismatch return with `{ settled: true, reason: 'BYPASS' }` | **FAILED AS EXPECTED (REAL TEST)** | Real test. Failed immediately on `expect(result.reason).toBe('HASH_MISMATCH')`. |
| **Attack #4** | STATE-4 Duplicate callback replay short-circuit | Disabled `if (isDuplicate)` branch | **FAILED AS EXPECTED (REAL TEST)** | Catches replay. Note: runs with `skipHashVerifyForTest: true` and mock DB stubs. |
| **Attack #5** | Callback where `txnid` is swapped for another order's | N/A | **TEST MISSING** | No test exists in `securityAttackSuite.spec.ts` or repository. |
| **Attack #7** | Customer closes tab, webhook/recon settles within 10m | N/A | **TEST MISSING** | No test exists. Webhook route and reconciliation job do not exist. |
| **Attack #8** | Section 4.3 Expired order revival with stock | Changed revival return to `settled: false` | **FAILED AS EXPECTED (REAL TEST)** | Real test. Note: uses injected mock stock callback stub. |
| **Attack #11** | RZP-3 Razorpay webhook HMAC tampering | Replaced `crypto.timingSafeEqual(expBuf, sigBuf)` with `return true` | **STILL PASSED (TEST IS WORTHLESS)** | **WORTHLESS TEST**. The test supplied `'tampered_signature_hex'` (length 22) instead of a 64-char hex string, so it exited early at the length check and never exercised signature verification. |
| **Attack #14** | Two buyers race concurrently for last unit | N/A | **TEST MISSING** | No concurrency test exists. |
| **Attack #17** | UPI-3 Manual UTR collision rejection | Replaced collision error with `{ accepted: true }` | **FAILED AS EXPECTED (REAL TEST)** | Real test. Failed on `expect(res2.accepted).toBe(false)`. |
| **Attack #18** | Over-refund or parallel race refunds | N/A | **TEST MISSING** | No test exists in `securityAttackSuite.spec.ts`. |
| **Attack #21** | AUTH-2 BOLA defense: Customer B requesting Customer A order | Bypassed ownership check in `assertOrderOwnership` | **FAILED AS EXPECTED (REAL TEST)** | Real unit test for `assertOrderOwnership`. (However, helper is not called in runtime `orderController.ts`). |
| **Attack #23** | AUTH-4 Profile update role/admin privilege escalation | N/A | **TEST MISSING** | No test exists in `securityAttackSuite.spec.ts`. |
| **Attack #28** | DB-1 Universal deny-all security rules in `firestore.rules` | Changed `orders/{orderId}` to `allow create, update: if true;` | **STILL PASSED (TEST IS WORTHLESS)** | **WORTHLESS TEST**. Test only performs a substring search `expect(rules).toContain('match /{document=**} {')`. Does not execute rules against an emulator or catch open collections. |

---

## 6. Detailed Bug Reports (Section 15.4 Template)

### BUG-SS-001: Order State Machine Transition Function `transition()` Never Implemented
- **Severity**: **S0 (Critical)**
- **Environment**: All environments
- **Steps to reproduce**:
  1. Inspect `shared/stateMachine.ts` and `backend/src/shared/stateMachine.ts`.
  2. Search for `function transition` across entire repository.
  3. Inspect runtime order transition controller `backend/src/admin/adminController.ts:333`.
- **Expected (STATE-1, STATE-2, STATE-3)**: Legal transitions live in `shared/stateMachine.ts`. All status changes invoke `transition()`. It executes inside a Firestore transaction using compare-and-set and appends an immutable event record to `orders/{id}/events`.
- **Actual**: `transition()` does not exist. Statuses are updated directly via `updateDoc` without transactional concurrency guards or event audit records.
- **Evidence**: `shared/stateMachine.ts:1-115`, `backend/src/orders/orderService.ts:140-141`, `backend/src/admin/adminController.ts:333`.
- **Suspected owner path**: `shared/**` (Architect) and `backend/src/orders/**` (Orders and Inventory).

---

### BUG-SS-002: Late Payment Settlement Illegally Revives `CANCELLED` Orders
- **Severity**: **S0 (Critical)**
- **Environment**: Staging / Production
- **Steps to reproduce**:
  1. Create an order and cancel it (`orderStatus = 'CANCELLED'`).
  2. Send a valid PayU payment success callback for the order's `txnid`.
  3. Observe order status in database.
- **Expected (STATE-5, Section 4.3 rule 4)**: "4. A CANCELLED order is never revived. Money that arrives for it goes straight to REFUND_PENDING with reason PAYMENT_AFTER_CANCEL."
- **Actual**: In `backend/src/payments/payuService.ts:785`, `isExpired` checks only `order.orderStatus === 'EXPIRED'`. A `CANCELLED` order falls through to line 846, which executes `orderStatus: 'CONFIRMED'`, reviving the cancelled order.
- **Evidence**: `backend/src/payments/payuService.ts:784-850`.
- **Suspected owner path**: `backend/src/payments/**` (Payments).

---

### BUG-SS-003: Widespread Stored XSS Sinks and 1,274 Banned Pattern Violations in Frontend
- **Severity**: **S0 (Critical)**
- **Environment**: Storefront & Admin (`public/`)
- **Steps to reproduce**:
  1. Open `public/admin/admin.js` lines 3811-3875 (Subscriber campaign tool) or line 2705 (POS receipt).
  2. Open `public/site/script.js` line 5145 (Customer reviews marquee slider).
  3. Submit a review or subscriber name containing `<img src=x onerror=alert(1)>`.
  4. View the admin subscriber dashboard or storefront reviews marquee.
- **Expected (XSS-1, XSS-2, XSS-3, UI-7, FE-1)**: Zero usage of `innerHTML`, `document.write`, inline `<script>`, inline `onclick`, or inline `style=`. All dynamic data rendered exclusively via `textContent` or `createElement`.
- **Actual**: 1,274 violations across `public/`: 116 `innerHTML` usages, 1 `document.write` (`admin.js:2705`), 29 inline scripts, 9 inline event handlers, 1,119 inline styles.
- **Evidence**: `public/admin/admin.js:2705, 3811-3875`, `public/site/script.js:5145`.
- **Suspected owner path**: `public/admin/**` (Admin) and `public/site/**` (Storefront).

---

### BUG-SS-004: Storefront Footer Directly Calls Firebase Firestore Web SDK (Bypassing API Gate)
- **Severity**: **S0 (Critical)**
- **Environment**: Storefront (`public/site/`)
- **Steps to reproduce**:
  1. Open `public/site/script.js` line 288.
  2. Enter an email in the footer newsletter box on any storefront page and submit.
  3. Observe browser network requests.
- **Expected (DB-1, ARCH-3, ARCH-5, Section 11.2)**: "The browser NEVER reads or writes Firestore directly. Everything goes through the API services with the Admin SDK." Collection must be an approved collection in Section 11.2 with Turnstile verification and rate limiting.
- **Actual**: `public/site/script.js:288-290` dynamically imports `https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js` and writes directly to unapproved collection `'newsletter_subscribers'` using client credentials without Turnstile or API validation.
- **Evidence**: `public/site/script.js:288-290`.
- **Suspected owner path**: `public/site/**` (Storefront).

---

### BUG-SS-005: Firestore Security Rules Permit Unauthenticated Direct Client Write to User Profiles
- **Severity**: **S0 (Critical)**
- **Environment**: Database (`firestore.rules`)
- **Steps to reproduce**:
  1. Inspect `firestore.rules` lines 59-74.
  2. Issue a client `setDoc` or `addDoc` to `/users/{randomUid}` or `/customers/{randomUid}` with payload `{ name: "Attacker", email: "att@evil.com" }`.
- **Expected (DB-1, AUTH-4)**: Universal deny-all: `match /{document=**} { allow read, write: if false; }`. Direct client writes to users are strictly forbidden.
- **Actual**: Lines 62-65 and 70-74 contain:
  ```
  allow create, update: if !('admin' in request.resource.data) &&
    !('role' in request.resource.data) &&
    !('roles' in request.resource.data) &&
    !('claims' in request.resource.data);
  ```
  In Firestore rules, matching `allow` rules are OR'd together. This rule grants anyone the ability to create and overwrite user documents directly.
- **Evidence**: `firestore.rules:62-65, 70-74`.
- **Suspected owner path**: `firestore.rules` (Database).

---

### BUG-SS-006: 20 of 37 Attack Tests Missing; Suite Relies on Mock Stubs
- **Severity**: **S1 (High)**
- **Environment**: Test Suite (`backend/tests/securityAttackSuite.spec.ts`)
- **Steps to reproduce**:
  1. Compare Section 16.3 attack checklist with `backend/tests/securityAttackSuite.spec.ts`.
  2. Inspect Attack #11 implementation in `securityAttackSuite.spec.ts:215-226`.
- **Expected (Section 16.3)**: Automated tests for all 37 attacks in Section 16.3 executing against real production code modules.
- **Actual**: 20 attacks (5, 7, 10, 12, 13, 14, 15, 18, 20, 23, 24, 25, 26, 29, 32, 34, 35, 36, 37) are missing. Attack #11 passes an invalid length string that bypasses HMAC verification. Attack #28 is a string search.
- **Evidence**: `backend/tests/securityAttackSuite.spec.ts:1-392`.
- **Suspected owner path**: `tests/**` (QA and Audit).

---

### BUG-SS-007: Hardcoded Pincode and Miscalculated Quote TTL in Pricing Engine
- **Severity**: **S1 (High)**
- **Environment**: Backend (`backend/src/pricing/pricingEngine.ts`)
- **Steps to reproduce**:
  1. Open `backend/src/pricing/pricingEngine.ts` line 70 and line 169.
  2. Call `priceOrder` with any input.
- **Expected (PRICE-5, PRICE-9, 7.2, D5)**: Pincodes loaded from `config/deliveryZones`. Unserviceable pincodes rejected. Quote TTL is 10 minutes.
- **Actual**: Pincode `'274001'` is hardcoded in line 70. Quote TTL is set to 15 minutes (`CONFIG_LIMITS.reserveOnlineMinutes`) in line 169.
- **Evidence**: `backend/src/pricing/pricingEngine.ts:12, 70, 168-169`.
- **Suspected owner path**: `backend/src/pricing/**` (Orders and Inventory).

---

### BUG-SS-008: Unlisted Collections in Production Code and Index Declarations
- **Severity**: **S1 (High)**
- **Environment**: Staging / Production
- **Steps to reproduce**:
  1. Inspect `firestore.indexes.json` lines 62-76.
  2. Search for collection names in `backend/src`.
- **Expected (Section 11.2, AGENT-2)**: Only collections approved in Section 11.2 are permitted.
- **Actual**: `inventory_logs` and `payment_transactions` are indexed in `firestore.indexes.json`. `messages`, `customers`, `addresses`, `idempotency`, `paymentAuditLog`, `rate_limits`, `_health`, `offline_finances`, and `newsletter_subscribers` are created in code.
- **Evidence**: `firestore.indexes.json:62-76`, `backend/src/inventory/inventoryService.ts:224`, `public/admin/admin.js:2010`.
- **Suspected owner path**: `firestore.indexes.json` (Database), `backend/src/**`.

---

### BUG-SS-009: Discount Atomic Redemption (DISC-2..5) Missing in Backend
- **Severity**: **S1 (High)**
- **Environment**: Backend (`backend/src/pricing/`)
- **Steps to reproduce**:
  1. Search for `redemptions` collection across `backend/src/`.
  2. Inspect `validateDiscountCode` in `pricingEngine.ts:96-128`.
- **Expected (DISC-2, DISC-3, DISC-4, DISC-5)**: Atomic creation of `redemptions/{code}_{orderId}`; release on order expiry/cancellation; per-user and per-phone guest limits; 10/10m rate limiter.
- **Actual**: `redemptions` collection is never written to. Guest limits and code-attempt rate limits are not implemented.
- **Evidence**: `backend/src/pricing/pricingEngine.ts:51-128`.
- **Suspected owner path**: `backend/src/pricing/**` (Orders and Inventory).

---

### BUG-SS-010: Exact Stock Quantities Exposed to Frontend Clients
- **Severity**: **S1 (High)**
- **Environment**: Storefront (`public/site/`)
- **Steps to reproduce**:
  1. Open `public/site/js/productsData.js` in a browser.
  2. Inspect product variant objects.
- **Expected (STOCK-2)**: "The public API returns `inStock` and `lowStock` flags only. Exact quantities are visible to admins only."
- **Actual**: Variants contain exact stock counts (`stock: 50, 35, 20...`) readable by any user in DevTools.
- **Evidence**: `public/site/js/productsData.js:42-44, 81-83`.
- **Suspected owner path**: `public/site/**` (Storefront) and `backend/src/products/**`.

---

### BUG-SS-011: PayU Webhook Route and Reconciliation Job Missing
- **Severity**: **S1 (High)**
- **Environment**: Backend (`backend/src/payments/`)
- **Steps to reproduce**:
  1. Inspect `backend/src/app.ts` payment route declarations.
  2. Inspect `backend/src/payments/paymentController.ts:46`.
- **Expected (PAY-5, PAY-6, PAY-7, ARCH-8)**: Canonical `settlePayuPayment` called by callback, webhook, and cron reconciliation. Expiry job checks gateway before releasing stock.
- **Actual**: PayU webhook route is not registered. Reconciliation job and expiry job do not exist. Controller calls legacy `processPayUResponse` instead of `settlePayuPayment`.
- **Evidence**: `backend/src/app.ts:158-161`, `backend/src/payments/paymentController.ts:46`.
- **Suspected owner path**: `backend/src/payments/**` (Payments).

---

### BUG-SS-012: Guest Order Lookup Uses `!==` (Banned Comparison) and Returns HTTP 403
- **Severity**: **S1 (High)**
- **Environment**: Backend (`backend/src/orders/`)
- **Steps to reproduce**:
  1. Submit a guest order lookup with an incorrect secret to `POST /api/v1/orders/guest-lookup`.
  2. Inspect response status code and `backend/src/orders/orderController.ts:102`.
- **Expected (AUTH-2, AUTH-3, HARD RULES)**: Hashed guest token compared using `crypto.timingSafeEqual` (never `!==` or `===`). Returns HTTP 404 Not Found on mismatch (never 403).
- **Actual**: Uses `providedHash !== data.guestSecretHash` and throws `AuthorizationError` returning HTTP 403 Forbidden.
- **Evidence**: `backend/src/orders/orderController.ts:102`, `backend/src/orders/orderService.ts:650`.
- **Suspected owner path**: `backend/src/orders/**` (Orders and Inventory).

---

### BUG-SS-013: Test vs. Live Key Startup Validation Missing
- **Severity**: **S1 (High)**
- **Environment**: Backend (`backend/src/config/environment.ts`)
- **Steps to reproduce**:
  1. Set `NODE_ENV=production` and `RAZORPAY_KEY_ID=rzp_test_12345`.
  2. Run `validateStartupConfig()`.
- **Expected (PAY-11)**: Startup check refuses to boot production with test keys, and non-production with live keys.
- **Actual**: Validation passes without error. No key prefix verification exists.
- **Evidence**: `backend/src/config/environment.ts:94-180`.
- **Suspected owner path**: `backend/src/config/**` (Security and Auth).

---

### BUG-SS-014: Stricter Admin CSP Header Missing
- **Severity**: **S2 (Medium)**
- **Environment**: Admin Site (`public/admin/`)
- **Steps to reproduce**:
  1. Inspect `public/admin/` for `_headers`.
  2. Request `/admin/index.html` and inspect headers.
- **Expected (Section 10.1, ARCH-4)**: Admin site served with strict CSP: `script-src 'self'`, no third-party frames, `require-trusted-types-for 'script'`.
- **Actual**: No `_headers` exists in `public/admin/`, and `app.ts:104` serves `/admin` with standard static middleware.
- **Evidence**: `public/admin/`, `backend/src/app.ts:104`.
- **Suspected owner path**: Security and Auth.

---

### BUG-SS-015: Nightly Data Invariants Are Pure Unit Mocks, Not Real Nightly Jobs
- **Severity**: **S2 (Medium)**
- **Environment**: Background Jobs (`backend/tests/nightlyInvariants.spec.ts`)
- **Steps to reproduce**:
  1. Inspect `backend/tests/nightlyInvariants.spec.ts`.
  2. Search for scheduled jobs or cron runners in `backend/src`.
- **Expected (Section 15.2, INV-1..9)**: An automated job running every night at 02:00 IST checking real Firestore records and raising tickets on invariants.
- **Actual**: Tests define local arrow functions on mock JSON literals inside the test file. No scheduled job or runner exists.
- **Evidence**: `backend/tests/nightlyInvariants.spec.ts:1-241`.
- **Suspected owner path**: QA and Audit / Orders.

---

### BUG-SS-016: Multi-Agent Role Ownership Violations Across Staging History
- **Severity**: **S2 (Medium)**
- **Environment**: Git Repository (`staging`)
- **Steps to reproduce**:
  1. Inspect `git log --stat` commits `0676419`, `b04980e`, `4107e78`.
- **Expected (Section 14.1, Section 14.2)**: Each role edits only its owned paths. Work follows ticket flow on branches.
- **Actual**:
  - Storefront edited Pages `_headers` (owned by Security & Auth).
  - Orders & Inventory duplicated `shared/**` inside `backend/src/shared/**` (owned by Architect).
  - Database commit `b04980e` pushed directly to staging without ticket branch.
  - Multiple feature agents authored unit tests in `backend/tests/` (owned by QA).
- **Evidence**: `git log --stat 444d586..staging`.
- **Suspected owner path**: Storefront, Orders & Inventory, Database.

---

## 7. Scope of Non-Verifiable Items

The following items could not be verified by automated tests in this audit:
1. **Cloudflare Zero Trust / Cloudflare Access configuration (AUTH-4, AUTH-6)**: Cloudflare edge network rules and Access policies reside in Cloudflare dashboard / infrastructure and cannot be verified within local repository test suites.
2. **Point-in-Time Recovery and Daily Backups (BACKUP-1, BACKUP-2)**: Database backups are GCP Firestore managed service configurations that require cloud IAM and active project billing.
3. **Hardware Key MFA for Owner (D4)**: Physical WebAuthn / FIDO2 security key enforcement cannot be simulated in local test scripts.
4. **Third-Party Payment Gateway Dashboard Workflows (D7, SECRETS-6)**: Manual refund processing in PayU/Razorpay merchant dashboards cannot be verified without live gateway credentials.
5. **DNS Subdomain Routing and CDN Cache Invalidation (ARCH-3, ARCH-9, D10)**: DNS propagation and Cloudflare CDN caching behaviors require live domain infrastructure.

---

## 8. Final Audit Sign-Off

- **Verified Tests Count**: 46
- **Not Verified Claims Count**: 58
- **Specification & Security Violations**: 26
- **Independent QA Assessment**: **DO NOT MERGE TO MAIN. DO NOT DEPLOY TO PRODUCTION.**
- Work must be assigned to path owners under Section 14.1 to address the S0 and S1 bugs before any release candidate is considered.
