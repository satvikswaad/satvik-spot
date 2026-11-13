# Wave B Independent QA & Security Audit Report (docs/WAVE_B_REVIEW.md)

**Role**: QA and Audit (Fresh Independent Reviewer)  
**Date**: 2026-11-13  
**Base Commit / Branch**: `staging` (`e7d9e87`)  
**Scope**: Ticket T-015 (Authoritative State Machine & Canonical `transition()` Engine) against `docs/SPEC.md` (v2.6) and `docs/DECISIONS.md`.

---

## 1. Executive Summary & Audit Verdict

- **Overall Verdict**: **FAIL**
- **S0 (Critical)**: 0
- **S1 (High)**: 1 (Untested critical authorization check: missing `authTimestampSeconds` on step-up order transitions)
- **S2 (Medium)**: 2 (Untested order existence 404 in `transition()`; untested payment status transitions in `transition()`)
- **S3 (Low)**: 1 (Redundant defensive state checks in `validateAndCalculateTransition`)
- **Worthless / Untested Mutation Tests Detected**: 2 (Mutations that completely disabled security/domain checks without causing any test failures)

> **Verdict Justification**: Per specification protocol section 15.4 and master audit instructions, Wave B **CANNOT PASS** until all S1 findings and worthless/untested mutation gaps are resolved. While the state machine whitelist, compare-and-set semantics, version incrementing, and event logging in `orders/{id}/events` are implemented and verified, mutation testing revealed that:
> 1. Completely removing the check for missing `authTimestampSeconds` on privileged state transitions (`CONFIRMED -> CANCELLED` and `* -> RETURNED`) passes 100% of the tests because no test exercises a privileged transition with `authTimestampSeconds: undefined`. If omitted, `assertStepUpFreshness(undefined)` calculates `NaN`, which bypasses the `> 300` check and allows unauthenticated cancellation.
> 2. Completely removing the Firestore order existence check (`if (!snap.exists) throw 404`) in `transition()` passes 100% of the tests because no test exercises `transition()` against a non-existent document.

---

## 2. Gate Command Execution & Exact Outputs

All commands were executed in the repository root (`u:\SatvikSwad`):

### 2.1 Specification Hash Verification (`node scripts/verify-spec-hash.js`)
```text
✅ Spec hash verified: 2b6974c88ede21974207d570cb6833a928151613a0989519a9c5d34abe4e6590
Exit Code: 0
```

### 2.2 TypeScript Backend Compilation (`npm --prefix backend run build`)
```text
> satwik-spot-backend@1.0.0 build
> tsc

Exit Code: 0 (Zero TypeScript compilation errors)
```

### 2.3 Full Backend Test Suite (`npm --prefix backend run test`)
```text
Test Suites: 19 passed, 19 total
Tests:       483 passed, 483 total
Snapshots:   0 total
Time:        10.016 s, estimated 11 s
Ran all test suites.
Exit Code: 0
```

### 2.4 T-009 Script 1: Spec Hash (`npm run verify:spec`)
```text
> satwik-spot@1.0.0 verify:spec
> node scripts/verify-spec-hash.js

✅ Spec hash verified: 2b6974c88ede21974207d570cb6833a928151613a0989519a9c5d34abe4e6590
Exit Code: 0
```

### 2.5 T-009 Script 2: Collection Scanner (`npm run scan:collections`)
```text
> satwik-spot@1.0.0 scan:collections
> node scripts/scan-collection-names.js

=== FIRESTORE COLLECTION SCAN ===
✅ Zero unapproved collections found.
ℹ️  Note: Found 35 transitional collection references undergoing phased migration.
Exit Code: 0
```

### 2.6 T-009 Script 3: Secret Scanner (`npm run scan:secrets`)
```text
> satwik-spot@1.0.0 scan:secrets
> node scripts/scan-secrets.js

=== SECRET SCAN ===
✅ Clean: No hardcoded secrets or production credentials detected.
Exit Code: 0
```

### 2.7 T-009 Script 4: Forbidden Pattern Scanner (`npm run scan:banned`)
```text
> satwik-spot@1.0.0 scan:banned
> node scripts/scan-banned-patterns.js

=== FORBIDDEN PATTERN SCAN (AGENT-8) ===
- innerHTML: 101 occurrences across 6 files
----------------------------------------
Total Banned Pattern Hits: 101 (backend/shared: 0)
✅ Forbidden pattern scan passed (0 in backend/shared, within baseline limits).
Exit Code: 0
```

---

## 3. Claim Verification Matrix (Rule-by-Rule Audit)

Standard applied per audit mandate: **"A test counts only if it calls the REAL module with real assertions, not a mock of the thing being protected."**

| Rule ID | Spec Requirement | Claimed Implementation | Claimed Tests in Suite | Audit Status | Evidence & Line Numbers |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **STATE-1** | Legal transitions live in ONE file `shared/stateMachine.ts` as an explicit whitelist. No direct writes; all call `transition()`. | Whitelist defined in `ORDER_TRANSITIONS` & `PAYMENT_TRANSITIONS`; centralized `transition()` function. | `sharedFoundation.spec.ts:167-181`, `212-254` | **VERIFIED** | Real module `shared/stateMachine.ts:29-54` called directly. 11 valid order transitions verified (lines 212-234); 7 illegal transitions rejected with `TransitionError` (lines 236-254). |
| **STATE-2** | Runs inside a Firestore transaction (compare-and-set). Read order, check status, increment version, commit atomically. | `transition()` accepts `db` and uses `db.runTransaction` or `existingTransaction`. Compare-and-set checks version and increments `version + 1`. | `sharedFoundation.spec.ts:256-303` | **VERIFIED** | Real `transition()` function executed against mock transaction runner. Verifies read, compare-and-set validation, update of `orderStatus`, and atomic version increment from 1 to 2 (`sharedFoundation.spec.ts:294-297`). |
| **STATE-3** | Appends immutable record to `orders/{id}/events` with `fromOrderStatus`, `toOrderStatus`, `actor`, `reason`, `version`, `timestamp`. | `txn.create(eventRef, { fromOrderStatus, toOrderStatus, actor, reason, version, timestamp })`. | `sharedFoundation.spec.ts:256-303` | **VERIFIED** | Verified `eventsAppended.length === 1`, `fromOrderStatus: PLACED`, `toOrderStatus: CONFIRMED`, `actor.uid: staff_1`, `version: 2` (`sharedFoundation.spec.ts:298-302`). |
| **STATE-4** | Same-state transition is an idempotent no-op returning success without mutating document or appending events. | `validateAndCalculateTransition` detects same-state and returns `changed: false`. `transition()` returns early with `success: true, changed: false`. | `sharedFoundation.spec.ts:194-198`, `305-340` | **VERIFIED** | Verified that same-state `CONFIRMED -> CONFIRMED` returns `success: true, changed: false`, does NOT call `txn.update`, and appends 0 events (`sharedFoundation.spec.ts:335-339`). |
| **STATE-5** | Terminal `orderStatus` values (`CANCELLED`, `EXPIRED`, `DELIVERED`, `RETURNED`) never change, with exception of late payment revival in 4.3. | `ORDER_TRANSITIONS` whitelist restricts terminal states; defensive checks reject modifications. | `sharedFoundation.spec.ts:183-187`, `paymentsSettlement.spec.ts:262-293` | **VERIFIED** | Verified `CANCELLED -> CONFIRMED` rejected (`sharedFoundation.spec.ts:184`), `RETURNED -> DELIVERED` rejected (line 186), and late payment on `CANCELLED` order sets `REFUND_PENDING` without changing `orderStatus` (`paymentsSettlement.spec.ts:289-293`). |
| **STATE-6** | Step-up operations require admin authentication within last 300 seconds (AUTH-5). | `assertStepUpFreshness` checks `elapsed >= 0 && elapsed <= 300`. Privilege check on `CONFIRMED -> CANCELLED` and `* -> RETURNED`. | `sharedFoundation.spec.ts:342-373`, `securityAuth.spec.ts:247-258` | **PARTIALLY VERIFIED (S1 Gap)** | Stale auth (`305s > 300s`) correctly throws `TransitionError` 403 (`sharedFoundation.spec.ts:372`). **GAP**: Missing `authTimestampSeconds` (undefined) is NOT tested. Removing `!actor.authTimestampSeconds` causes zero test failures. |
| **4.2** | Table of legal `orderStatus` transitions. | Table-driven matrix implementation in `shared/stateMachine.ts:29-38`. | `sharedFoundation.spec.ts:212-254` | **VERIFIED** | All 11 legal forward transitions in Section 4.2 table tested and pass (`sharedFoundation.spec.ts:212-234`). Illegal transitions rejected (lines 236-254). |
| **4.3** | Late payment revival for `EXPIRED` orders: revival to `CONFIRMED` if stock reserved, else `REFUND_PENDING` with `LATE_PAYMENT_NO_STOCK`. | Whitelist permits `EXPIRED -> CONFIRMED`. Payment settlement handles revival. | `sharedFoundation.spec.ts:189-192`, `paymentsSettlement.spec.ts:233-260` | **VERIFIED** | Verified `EXPIRED -> CONFIRMED` allowed (`sharedFoundation.spec.ts:190`), while `EXPIRED -> PROCESSING` rejected (line 191). Out-of-stock late payment sets `REFUND_PENDING` (`paymentsSettlement.spec.ts:258-259`). |

---

## 4. Mutation Proof Table (`../qa-scratch`)

All mutation tests were executed in an isolated clone environment in `u:\qa-scratch` using `node node_modules/jest/bin/jest.js --config jest.config.js`. Each protected statement was surgically mutated (inverted, disabled, or bypassed) and targeted tests were evaluated.

| # | Protected Check / Claim | Target File & Snippet | Mutation Applied | Targeted Test Run | Test Result When Check Broken | Audit Verdict |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| **MUT-01** | **STATE-1, 4.2**: Order transition whitelist enforcement | `shared/stateMachine.ts:156`<br>`if (!isValidTransition('order', currentOrderStatus, targetOrderStatus))` | Inverted check: `if (false && !isValidTransition(...))` | `tests/sharedFoundation.spec.ts`<br>`-t "Illegal order transition rejected: PROCESSING -> PLACED"` | **FAILED (Status 1)** | **CAUGHT** |
| **MUT-02** | **STATE-5**: CANCELLED is terminal | `shared/stateMachine.ts:35`<br>`CANCELLED: ['CANCELLED']` | Added `CONFIRMED`: `['CANCELLED', 'CONFIRMED']` | `tests/sharedFoundation.spec.ts`<br>`-t "STATE-5: Terminal order states reject illegal transitions"` | **FAILED (Status 1)** | **CAUGHT** |
| **MUT-03** | **Section 4.2**: DELIVERED can only transition to RETURNED | `shared/stateMachine.ts:33`<br>`DELIVERED: ['DELIVERED', 'RETURNED']` | Added `PLACED` to `ORDER_TRANSITIONS.DELIVERED` | `tests/sharedFoundation.spec.ts`<br>`-t "Illegal order transition rejected: DELIVERED -> PLACED"` | **PASSED (Status 0)** | **WORTHLESS / UNTESTED** *(Secondary defensive check on line 170 caught it; standalone whitelist untested for PLACED)* |
| **MUT-04** | **Section 4.3**: EXPIRED can only transition to CONFIRMED | `shared/stateMachine.ts:36`<br>`EXPIRED: ['EXPIRED', 'CONFIRMED']` | Added `SHIPPED` to `ORDER_TRANSITIONS.EXPIRED` | `tests/sharedFoundation.spec.ts`<br>`-t "Illegal order transition rejected: EXPIRED -> SHIPPED"` | **PASSED (Status 0)** | **WORTHLESS / UNTESTED** *(Secondary defensive check on line 177 caught it; standalone whitelist untested for SHIPPED)* |
| **MUT-05** | **STATE-6, AUTH-5**: Step-up required when `authTimestampSeconds` missing | `shared/stateMachine.ts:188`<br>`if (!actor.authTimestampSeconds) throw new TransitionError(..., 403)` | Removed check completely: `// Step-up check bypassed` | Full `tests/sharedFoundation.spec.ts` (All 40 tests) | **PASSED (Status 0)** | **WORTHLESS / UNTESTED (S1)** *(Zero tests call transition with undefined auth timestamp on privileged transition)* |
| **MUT-06** | **STATE-6, AUTH-5**: Freshness window 300 seconds | `shared/stateMachine.ts:109`<br>`if (elapsed < 0 \|\| elapsed > 300)` | Inverted check: `if (false && (elapsed < 0 \|\| elapsed > 300))` | `tests/sharedFoundation.spec.ts`<br>`-t "STATE-6: transition.*throws 403"` | **FAILED (Status 1)** | **CAUGHT** |
| **MUT-07** | **STATE-4**: Idempotent same-state transition | `shared/stateMachine.ts:143`<br>`if ((!targetOrderStatus \|\| targetOrderStatus === currentOrderStatus) ...)` | Bypassed check: `if (false)` | `tests/sharedFoundation.spec.ts`<br>`-t "STATE-4: transition.*handles same-state as idempotent no-op"` | **FAILED (Status 1)** | **CAUGHT** |
| **MUT-08** | **STATE-3**: Append immutable event to `orders/{id}/events` | `shared/stateMachine.ts:297`<br>`txn.create(eventRef, { ... })` | Disabled event creation: `// txn.create bypassed` | `tests/sharedFoundation.spec.ts`<br>`-t "STATE-2, STATE-3: transition.*executes compare-and-set"` | **FAILED (Status 1)** | **CAUGHT** |
| **MUT-09** | **STATE-2**: Version increment on transition | `shared/stateMachine.ts:283`<br>`const newVersion = currentVersion + 1;` | Fixed version: `const newVersion = currentVersion;` | `tests/sharedFoundation.spec.ts`<br>`-t "STATE-2, STATE-3: transition.*executes compare-and-set"` | **FAILED (Status 1)** | **CAUGHT** |
| **MUT-10** | **Error Handling**: Order existence check in `transition()` | `shared/stateMachine.ts:251`<br>`if (!snap.exists) throw new TransitionError(..., 404)` | Removed check: `// Order existence check removed` | Full `tests/sharedFoundation.spec.ts` (All 40 tests) | **PASSED (Status 0)** | **WORTHLESS / UNTESTED (S2)** *(Zero tests verify transition() 404 behavior on missing orders)* |
| **MUT-11** | **Payment Whitelist**: REFUNDED is terminal | `shared/stateMachine.ts:52`<br>`REFUNDED: ['REFUNDED']` | Added `PAID`: `['REFUNDED', 'PAID']` | `tests/sharedFoundation.spec.ts`<br>`-t "Payment status whitelist validates legal payment flows"` | **FAILED (Status 1)** | **CAUGHT** |

---

## 5. Architectural, Configuration & Security Checks

### 5.1 Export and Import of `transition()`
- **Export**: `transition()` is canonically exported from `shared/stateMachine.ts:242` and duplicated in `backend/src/shared/stateMachine.ts:242`. `backend/src/shared/index.ts` re-exports it.
- **Import**: `transition()` is imported in `backend/tests/sharedFoundation.spec.ts:19`.
- **Note on backend controllers**: `backend/src/admin/adminController.ts` currently performs legacy transition logic. Per `docs/PROGRESS.md`, full migration of the admin controller to call `transition()` is scheduled for **Wave D (T-024)**.

### 5.2 Change Request Approvals Tracking
- `docs/cr/APPROVALS.md` exists and contains verbatim:
  ```text
  # Change Request Approvals (docs/cr/APPROVALS.md)

  Owner approved on 2026-11-13
  ```
  Verified.

### 5.3 File Ownership & Path Hygiene (Section 14.1 & DECISIONS.md)
- **Architect Path Ownership**: `shared/stateMachine.ts`, `backend/src/shared/stateMachine.ts`, `backend/tests/sharedFoundation.spec.ts` are owned by Architect.
- **Commit Aggregation**: Commit `e7d9e87` combined the remediation fixes for Wave A audit findings (`backend/src/app.ts`, `backend/src/auth/securityGateService.ts`, `backend/src/orders/orderController.ts`, `backend/src/orders/orderService.ts`, `firestore.rules`, `scripts/scan-banned-patterns.js`) into the same commit as Wave B T-015. While these fixes successfully resolved the Wave A S1 audit blockers, future waves must commit strictly on role-owned branches per Section 14.1.

### 5.4 Data Types, Collections & Secrets Inspection
- **Collection Names**: `npm run scan:collections` verified 0 unapproved collections.
- **Floats in Money Code**: `shared/stateMachine.ts` contains no float operations. Money handling in backend remains integer paise only.
- **Pincodes & Tax Rates**: No hardcoded pincodes or tax rates introduced.
- **Constant-Time Comparison**: `orderController.ts`, `orderService.ts`, and `securityGateService.ts` strictly utilize `crypto.timingSafeEqual` with matching length buffers. Zero instances of `===` or `!==` on sensitive hashes, secrets, or tokens.

---

## 6. Formal Bug Reports (Section 15.4 Template)

### BUG-B-01: Missing Test Coverage for Missing Step-Up Auth Timestamp on Privileged Transitions
```text
Bug ID / Title:        BUG-B-01: Step-up authentication check on missing authTimestampSeconds is untested (MUT-05)
Severity (proposed):   S1
Found by:              QA agent (Wave B Audit), 2026-11-13
Environment:           staging, commit e7d9e87
Steps to reproduce:    1. In shared/stateMachine.ts:188-190, comment out:
                          if (!actor.authTimestampSeconds) {
                            throw new TransitionError('Step-up authentication required for this transition.', 403);
                          }
                       2. Run: npm --prefix backend test -- tests/sharedFoundation.spec.ts
Expected:              At least one test must fail, proving that a caller cannot execute CONFIRMED -> CANCELLED or * -> RETURNED without providing an auth timestamp.
Actual:                All 40 tests in sharedFoundation.spec.ts pass. The test on line 342 only passes staleTimestamp (305s ago), never undefined. Without the check, assertStepUpFreshness(undefined) computes NaN, which does not throw, permitting unauthenticated privileged state transitions.
Evidence:              MUT-05 mutation in u:/qa-scratch/runWaveBMutations.js passes with status 0.
Rule violated:         STATE-6, AUTH-5, BUG-1
Suspected owner path:  shared/stateMachine.ts, backend/tests/sharedFoundation.spec.ts
```

### BUG-B-02: Non-Existent Order 404 in `transition()` is Untested
```text
Bug ID / Title:        BUG-B-02: Order existence check (404) in transition() is untested (MUT-10)
Severity (proposed):   S2
Found by:              QA agent (Wave B Audit), 2026-11-13
Environment:           staging, commit e7d9e87
Steps to reproduce:    1. In shared/stateMachine.ts:251-253, remove:
                          if (!snap.exists) {
                            throw new TransitionError(`Order ${orderId} does not exist`, 404);
                          }
                       2. Run: npm --prefix backend test -- tests/sharedFoundation.spec.ts
Expected:              A test calling transition() with an unknown orderId fails with 404 TransitionError.
Actual:                All 40 tests in sharedFoundation.spec.ts pass because mockTxn always returns exists: true.
Evidence:              MUT-10 mutation in u:/qa-scratch/runWaveBMutations.js passes with status 0.
Rule violated:         STATE-2, 16.1, BUG-1
Suspected owner path:  backend/tests/sharedFoundation.spec.ts
```

### BUG-B-03: `targetPaymentStatus` Transitions Untested in `transition()` Runner
```text
Bug ID / Title:        BUG-B-03: transition() paymentStatus execution branch has zero test coverage
Severity (proposed):   S2
Found by:              QA agent (Wave B Audit), 2026-11-13
Environment:           staging, commit e7d9e87
Steps to reproduce:    1. Inspect backend/tests/sharedFoundation.spec.ts.
                       2. Search for calls to transition() with targetPaymentStatus.
Expected:              Per Section 4, an order is the pair (orderStatus, paymentStatus). transition() accepts targetPaymentStatus, updates it, and appends to events. Tests must verify this flow in transition().
Actual:                Zero tests call transition() with targetPaymentStatus. Only pure helper isValidTransition('payment', ...) is tested.
Evidence:              Lines 286, 331, 368 of backend/tests/sharedFoundation.spec.ts only provide targetOrderStatus.
Rule violated:         STATE-1, STATE-2, STATE-3, 16.1
Suspected owner path:  backend/tests/sharedFoundation.spec.ts
```

---

## 7. Required Remediation for Wave B Re-Audit

To achieve **PASS** on Wave B re-audit, the Architect role must add tests in `backend/tests/sharedFoundation.spec.ts` covering:
1. **Missing Auth Timestamp (STATE-6, AUTH-5)**: Calling `transition()` or `validateAndCalculateTransition()` for `CONFIRMED -> CANCELLED` and `DELIVERED -> RETURNED` with `actor: { uid: 'admin_1', role: 'admin_owner' }` (omitting `authTimestampSeconds`) must reject with HTTP 403 `TransitionError`.
2. **Missing Order (STATE-2)**: Calling `transition()` where `snap.exists === false` must reject with HTTP 404 `TransitionError`.
3. **Payment State Transition (STATE-1..3)**: Calling `transition()` with `targetPaymentStatus: 'PAID'` (or paired `targetOrderStatus: 'CONFIRMED', targetPaymentStatus: 'PAID'`) must update `paymentStatus`, increment version, and record `fromPaymentStatus` & `toPaymentStatus` in `orders/{id}/events`.
