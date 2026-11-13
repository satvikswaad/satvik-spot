# Wave A Independent QA & Security Audit Report (docs/WAVE_A_REVIEW.md)

**Role**: QA and Audit (Fresh Independent Reviewer)  
**Date**: 2026-11-13  
**Base Commit / Branch**: `staging` (`7a30dd4`)  
**Scope**: Tickets T-009, T-010, T-011, T-012, T-013, T-014 against `docs/SPEC.md` and `docs/DECISIONS.md`.

---

## 1. Executive Summary & Audit Verdict

- **Overall Verdict**: **FAIL**
- **S0 (Critical)**: 0
- **S1 (High)**: 5
- **S2 (Medium)**: 2
- **Worthless Tests Detected**: 4 (tests where breaking/bypassing the production check caused zero test failures, or where claimed tests ran isolated disconnected helper mocks)

> **Verdict Justification**: Per specification protocol section 15.4, Wave A **CANNOT PASS** because there are unresolved S1 severity findings and worthless tests. Protected checks were added in code, but either lack real Express integration tests (causing mutations to pass undetected) or are disconnected from live route handlers.

---

## 2. Gate Command Execution & Exact Outputs

All commands were executed in the repository root (`u:\SatvikSwad`):

### 2.1 Specification Hash Verification (`node scripts/verify-spec-hash.js`)
```text
✅ Spec hash verified: 79f2294af1cb600db403d73b3a8f463bb1ef08181b2f4f7dabf4d17f05b4ee09
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
Tests:       454 passed, 454 total
Snapshots:   0 total
Time:        27.621 s
Exit Code: 0
```

### 2.4 T-009 Script 1: Spec Hash (`npm run verify:spec`)
```text
> satwik-spot@1.0.0 verify:spec
> node scripts/verify-spec-hash.js

✅ Spec hash verified: 79f2294af1cb600db403d73b3a8f463bb1ef08181b2f4f7dabf4d17f05b4ee09
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
Total Banned Pattern Hits: 101
✅ Baseline scan recorded.
Exit Code: 0
```
*(Notice: Script exits with code 0 even with 101 hits because `--enforce` is not passed in `package.json` or `.github/workflows/security-ci.yml`. See Finding BUG-A-03).*

---

## 3. Claim Verification Matrix (Rule-by-Rule Audit)

Standard applied per audit mandate: **"A test counts only if it calls the REAL Express route or real module with the emulator, not a mock of the thing being protected."**

| Rule ID | Claimed Implementation | Claimed Test in Wave A | Reality / Audit Finding | Status |
| :--- | :--- | :--- | :--- | :---: |
| **DOC** | SHA-256 integrity verification of `docs/SPEC.md` | `scripts/verify-spec-hash.js` | Verified by CLI script `node scripts/verify-spec-hash.js`. Verified mutation in scratch: tampering with `docs/SPEC.md` immediately triggers exit code 1. | **VERIFIED** |
| **AGENT-8** | Forbidden pattern scan | `scripts/scan-banned-patterns.js` | **VIOLATED in CI**: Script exits code 0 in default mode; neither `package.json` nor `.github/workflows/security-ci.yml` passes `--enforce`. Does not scan for `===` on hashes/tokens, `Math.random`, or floats in money code. | **VIOLATED** |
| **DB-1** | Universal default-deny in `firestore.rules` | `functions/tests/firestoreRules.spec.ts:176-218` | **NOT VERIFIED / FAILING**: `npm run test:rules` under Firebase Emulator fails 9 tests (including Test 21). `backend/tests/databaseInvariants.spec.ts:12-20` only performs string regex matching on the file, not an emulator execution. | **NOT VERIFIED** |
| **AUTH-4** | Privilege escalation guard on profile writes | `firestore.rules:58-76` | **PARTIALLY VERIFIED**: Test 19 in `firestoreRules.spec.ts` passes against emulator (denies `admin: true`). However, Test 21 fails because field type/length validation is absent in the temporary patch. | **NOT VERIFIED** |
| **STATE-5** | CANCELLED order cannot be revived on payment | `backend/tests/paymentsSettlement.spec.ts:262-293` | **VERIFIED BY UNIT TEST / UNLINKED IN ROUTE**: Unit test `paymentsSettlement.spec.ts:262` verifies `settlePayuPayment`. Mutation caught (test fails when CANCELLED check removed). However, `settlePayuPayment` is an unused island not yet wired to the live Express webhook. | **VERIFIED (Unit)** |
| **4.3** | CANCELLED order sets `REFUND_PENDING` with `PAYMENT_AFTER_CANCEL` | `backend/tests/paymentsSettlement.spec.ts:262-293` | **VERIFIED BY UNIT TEST**: Mutation caught by `paymentsSettlement.spec.ts:262`. | **VERIFIED (Unit)** |
| **AUTH-2** | Rejects mismatched userId with HTTP 404 (NEVER 403) | `backend/tests/securityAuth.spec.ts:87-111` | **NOT VERIFIED**: Claimed test tests isolated helper `assertOrderOwnership` in `securityGateService.ts`. `assertOrderOwnership` is NEVER imported or called by `orderController.ts` or any route. Controller endpoint is untested for mismatched userId. | **NOT VERIFIED** |
| **AUTH-3** | Guest token validation with `timingSafeEqual` returning 404 | `backend/tests/securityAuth.spec.ts:97-111` | **NOT VERIFIED**: Real controller `lookupGuestOrderHandler` in `orderController.ts:107-111` and `submitUtrForOrder` in `orderService.ts:651` are NOT tested with invalid guest secrets. When mutated to `isValid = true`, all 454 tests continue to pass. | **NOT VERIFIED** |
| **ARCH-6** | Reject requests missing `X-Origin-Auth` with HTTP 403 | `backend/tests/securityAuth.spec.ts:13-36` | **NOT VERIFIED**: Claimed tests call `originGateMiddleware` as a standalone function with mock `req`/`res`. In `app.ts`, the middleware is disabled by default (`ORIGIN_GATE_ENABLED === 'true'`). Disabling it in `app.ts` causes zero test failures. | **NOT VERIFIED** |
| **PAY-11** | Startup check rejects test keys in prod & live keys in non-prod | `backend/src/config/environment.ts:183-196` | **NOT VERIFIED**: Zero tests exist in `backend/tests/` asserting that `rzp_test_` fails in production or `rzp_live_` fails in staging/dev. | **NOT VERIFIED** |
| **AUTH-1** | Verify Firebase ID token with `checkRevoked = true` | `backend/src/auth/verifyAuth.ts:169` | **NOT VERIFIED**: In tests, `isEmulator = true` branches to hardcoded `mock_` tokens and never calls `auth.verifyIdToken(token, true)`. Real token revocation is not tested against the Firebase Auth emulator. | **NOT VERIFIED** |

---

## 4. Mutation Testing Proof (Executed in `U:\qa-scratch`)

All mutations were performed in a detached scratch workspace at `U:\qa-scratch\repo`, leaving the authoritative repository `U:\SatvikSwad` completely untouched.

| # | Target File & Check | Applied Mutation | Test Command Executed | Result When Check Broken | Efficacy Verdict |
| :-: | :--- | :--- | :--- | :--- | :---: |
| **M1** | `payuService.ts:800` (STATE-5 CANCELLED order check) | Replaced with `if (false && (order.orderStatus === 'CANCELLED' ...))` | `node node_modules/jest/bin/jest.js tests/paymentsSettlement.spec.ts -t "STATE-5, 4.3"` | **Test FAILED** (caught mutation as expected) | **REAL TEST** |
| **M2** | `orderController.ts:107` (AUTH-3 guest secret check) | Replaced with `const isValid = true;` (bypasses secret check) | `node node_modules/jest/bin/jest.js --runInBand` | **All 454 tests STILL PASSED** | **WORTHLESS / UNTESTED** |
| **M3** | `orderController.ts:110` (AUTH-2/3 status code 404 vs 403) | Changed 404 to 403 on failed guest secret check | `node node_modules/jest/bin/jest.js --runInBand` | **All 454 tests STILL PASSED** | **WORTHLESS / UNTESTED** |
| **M4** | `orderService.ts:651` (AUTH-3 guest secret check in UTR submission) | Replaced with `const isValid = true;` | `node node_modules/jest/bin/jest.js --runInBand` | **All 454 tests STILL PASSED** | **WORTHLESS / UNTESTED** |
| **M5** | `app.ts:128` (ARCH-6 origin gate middleware mounting) | Replaced with `if (false) {` (disabled in Express app) | `node node_modules/jest/bin/jest.js --runInBand` | **All 454 tests STILL PASSED** | **WORTHLESS / UNTESTED** |
| **M6** | `environment.ts:183` (PAY-11 startup key validation) | Replaced with `if (false && nodeEnv === 'production')` | `node node_modules/jest/bin/jest.js tests/phase2Architecture.spec.ts` | **All tests STILL PASSED** (zero assertions on PAY-11) | **WORTHLESS / UNTESTED** |
| **M7** | `docs/SPEC.md` (DOC specification integrity) | Appended `<!-- TAMPER -->` comment | `node scripts/verify-spec-hash.js` | **Exited code 1: SPEC TAMPERING DETECTED** | **REAL SCRIPT** |
| **M8** | `scripts/scan-banned-patterns.js` (AGENT-8 forbidden patterns) | Injected `.innerHTML = "<div>evil</div>"` in backend source | `node scripts/scan-banned-patterns.js` (CI script) | **Exited code 0: PASSED** (Allowed banned pattern!) | **WORTHLESS IN CI** |

---

## 5. Architectural Call-Site & Unused Island Analysis

Grep analysis across all files in `backend/src/` revealed several isolated code islands that are defined and tested in isolation, but never invoked by the live application:

1. **`assertOrderOwnership`** (`backend/src/auth/securityGateService.ts:88`):
   - **Call sites in `backend/src/`**: 0
   - **Status**: **Unused Island**. `orderController.ts` wrote a duplicate inline check instead of importing this canonical function.
2. **`verifyStepUpAuth`** (`backend/src/auth/securityGateService.ts:126`):
   - **Call sites in `backend/src/`**: 0
   - **Status**: **Unused Island**. Admin middleware uses its own inline arithmetic in `adminMiddleware.ts`.
3. **`ROUTE_RATE_LIMITS`** (`backend/src/auth/securityGateService.ts:37`):
   - **Call sites in `backend/src/`**: 0
   - **Status**: **Unused Island**. Not wired to Express `rateLimiter.ts`.
4. **`settlePayuPayment`** (`backend/src/payments/payuService.ts:675`):
   - **Call sites in `backend/src/`**: 0
   - **Status**: **Unused Island in production**. `paymentController.ts:payuResponseHandler` calls `processPayUResponse`, NOT `settlePayuPayment`. (Full wiring is planned for Wave D T-022).

---

## 6. Code & Boundary Audits

1. **Collection Names**: Scanned with `scripts/scan-collection-names.js`. Result: 0 unapproved collections. Approved collections used: `payments`, `orders`, `config`, `users`, `customers`.
2. **Money Code**: Inspected `payuService.ts:825` (`amountPaise: order.totalPaise`). Zero floating-point arithmetic introduced in Wave A.
3. **Pincodes and Tax Rates**: Zero hard-coded pincodes or tax rates found in Wave A code.
4. **Hash & Token Comparisons**:
   - `orderController.ts:107`: Uses `bufProvided.length === bufStored.length && crypto.timingSafeEqual(...)`. (Safe).
   - `orderService.ts:651`: Uses `bufProvided.length === bufStored.length && crypto.timingSafeEqual(...)`. (Safe).
   - `securityGateService.ts:52`: Uses `crypto.timingSafeEqual(...)`. (Safe).
   - `scripts/verify-spec-hash.js:23`: Uses `computedHash.toLowerCase() === expectedHash`. Offline build script checking file integrity.
5. **Ownership Status Codes**:
   - All ownership failures in `orderController.ts`, `orderService.ts`, and `securityGateService.ts` explicitly throw HTTP 404 (`NOT_FOUND`), never 403.
6. **File Ownership vs Section 14.1 & DECISIONS.md**:
   - `healthRoutes.ts`: Modified (`db.collection('config').doc('deliveryZones').get()`) without being assigned to a Wave A ticket.
   - `public/admin/assets/`: 60+ images were re-compressed and committed without being part of any Wave A ticket scope.

---

## 7. Bug Reports (Section 15.4 Template)

### BUG-A-01: BOLA Defense on Guest Lookup & UTR Submission is Untested on Express Routes
```text
Bug ID / Title:        BUG-A-01: Guest lookup & UTR secret checks have zero live route tests (mutations pass)
Severity (proposed):   S1
Found by:              QA Agent, 2026-11-13
Environment:           dev | staging
Steps to reproduce:    1. In backend/src/orders/orderController.ts:107, set `const isValid = true;`
                       2. Run `npm --prefix backend run test`
Expected:              Tests exercising /api/v1/orders/guest-lookup should fail with invalid secret (AUTH-2, AUTH-3).
Actual:                All 454 backend tests pass cleanly. Zero tests verify that an invalid guestAccessSecret returns HTTP 404 on the Express endpoint.
Evidence:              Mutation M2 and M3 output in U:\qa-scratch\mutation_results.json
Rule violated:         AUTH-2, AUTH-3
Suspected owner path:  backend/src/orders/** (Orders and Inventory role)
```

### BUG-A-02: Origin Gate Middleware (ARCH-6) Disabled by Default & Untested on Express App
```text
Bug ID / Title:        BUG-A-02: Origin gate middleware requires optional env flag and lacks app integration test
Severity (proposed):   S1
Found by:              QA Agent, 2026-11-13
Environment:           staging | prod
Steps to reproduce:    1. In backend/src/app.ts:128, notice `if (process.env.ORIGIN_GATE_ENABLED === 'true')`
                       2. In backend/src/app.ts, comment out the origin gate mounting
                       3. Run `npm --prefix backend run test`
Expected:              Per ARCH-6, direct requests without X-Origin-Auth MUST be dropped with HTTP 403. Disabling it on the Express app must fail CI tests.
Actual:                The origin gate is not active unless an optional env var is explicitly passed. Furthermore, all 454 tests pass when it is completely removed from app.ts because existing tests only call the middleware function directly with mock req/res.
Evidence:              Mutation M5 output in U:\qa-scratch\mutation_results.json
Rule violated:         ARCH-6
Suspected owner path:  backend/src/app.ts, backend/src/auth/** (Security and Auth role)
```

### BUG-A-03: Forbidden Pattern Scan (AGENT-8) Does Not Enforce or Block PRs in CI
```text
Bug ID / Title:        BUG-A-03: scan:banned exits 0 on forbidden patterns because --enforce is missing in CI
Severity (proposed):   S1
Found by:              QA Agent, 2026-11-13
Environment:           CI job
Steps to reproduce:    1. Create a dummy file backend/src/dummy.ts containing `.innerHTML = ""`
                       2. Run `npm run scan:banned` or view .github/workflows/security-ci.yml line 43
Expected:              Scan script must exit code 1 and block the PR whenever a banned pattern is found (AGENT-8).
Actual:                Script prints "Baseline scan recorded" and exits with code 0. Banned patterns are allowed through CI.
Evidence:              Mutation M8 in U:\qa-scratch\mutation_results.json
Rule violated:         AGENT-8
Suspected owner path:  scripts/scan-banned-patterns.js, .github/workflows/security-ci.yml (QA and Audit)
```

### BUG-A-04: Firestore Rules Unit Tests Fail Under Emulator (Test 21 Fails)
```text
Bug ID / Title:        BUG-A-04: npm run test:rules fails under Firestore emulator with 9 test failures
Severity (proposed):   S1
Found by:              QA Agent, 2026-11-13
Environment:           dev (Firebase Emulator)
Steps to reproduce:    1. Run `npm run test:rules`
Expected:              All Firestore rules security test cases pass against the local emulator (DB-1, AUTH-4).
Actual:                Script exits with code 1. 9 tests fail, including Test 21 ("Invalid profile field types (short name) are REJECTED") because the temporary rules patch does not enforce field type/length constraints.
Evidence:              Step 90 task log: `Expected request to fail, but it succeeded at tests/firestoreRules.spec.ts:219:9`
Rule violated:         DB-1, AUTH-4
Suspected owner path:  firestore.rules, functions/tests/firestoreRules.spec.ts (Database role)
```

### BUG-A-05: Missing Dedicated Integration Tests for PAY-11 Key Verification
```text
Bug ID / Title:        BUG-A-05: PAY-11 startup test/live key check lacks dedicated test coverage
Severity (proposed):   S1
Found by:              QA Agent, 2026-11-13
Environment:           dev | staging | prod
Steps to reproduce:    1. Inspect backend/tests/phase2Architecture.spec.ts:54-119
                       2. Check for assertions testing rzp_test_ in prod or rzp_live_ in non-prod
Expected:              Dedicated unit/integration tests confirming startup rejection when keys do not match environment (PAY-11).
Actual:                Zero test cases exist asserting PAY-11 startup failures.
Evidence:              Grep of test files for PAY-11 yields 0 assertions.
Rule violated:         PAY-11
Suspected owner path:  backend/src/config/environment.ts, backend/tests/ (Security and Auth / QA)
```

### BUG-A-06: Duplicated and Unused Architectural Islands
```text
Bug ID / Title:        BUG-A-06: assertOrderOwnership and verifyStepUpAuth are unused islands
Severity (proposed):   S2
Found by:              QA Agent, 2026-11-13
Environment:           dev | staging
Steps to reproduce:    1. Grep for `assertOrderOwnership` across backend/src/
Expected:              Shared security functions are imported and utilized by the route controllers.
Actual:                `assertOrderOwnership` is never imported by any controller. `orderController.ts` implements a separate duplicate check.
Evidence:              Zero call sites in backend/src/ for assertOrderOwnership, verifyStepUpAuth, and ROUTE_RATE_LIMITS.
Rule violated:         ARCH-4
Suspected owner path:  backend/src/auth/securityGateService.ts, backend/src/orders/orderController.ts
```

### BUG-A-07: Unclaimed Out-of-Scope Files Modified in Staging
```text
Bug ID / Title:        BUG-A-07: healthRoutes.ts and public asset images modified outside Wave A tickets
Severity (proposed):   S2
Found by:              QA Agent, 2026-11-13
Environment:           staging
Steps to reproduce:    1. Run `git status`
                       2. Compare modified files against tickets T-009 to T-014 in docs/PROGRESS.md
Expected:              Only files owned by assigned tickets are modified (Section 14.1, AGENT-1).
Actual:                `backend/src/routes/healthRoutes.ts` and 60+ images in `public/admin/assets` were modified without ticket attribution.
Evidence:              Git status showing modified files not listed in PROGRESS.md.
Rule violated:         AGENT-1, Section 14.1
Suspected owner path:  Shared / Unassigned
```

---

## 8. Required Actions Before Wave A Re-Review

To achieve a **PASS** verdict in the next review wave:
1. **Orders Role**:
   - Write integration tests using `supertest(app)` against `POST /api/v1/orders/guest-lookup` and `POST /api/v1/orders/submit-utr` testing valid and invalid guest secrets, proving 404 is returned on failure and timingSafeEqual is exercised.
   - Refactor `orderController.ts` to utilize the canonical `assertOrderOwnership` or unify guest lookup logic.
2. **Security & Auth Role**:
   - Remove the `ORIGIN_GATE_ENABLED === 'true'` opt-in requirement or enforce it strictly in production configuration.
   - Add a `supertest(app)` integration test asserting that direct requests to `/api/v1/*` without `x-origin-auth` return HTTP 403.
   - Add unit tests for `validateStartupConfig` covering all PAY-11 conditions (`rzp_test_` in prod, `rzp_live_` in non-prod, `payuEnv === 'TEST'` in prod).
3. **Database Role**:
   - Fix `functions/tests/firestoreRules.spec.ts` and `firestore.rules` so that `npm run test:rules` passes cleanly under the emulator with zero failures.
4. **QA & Audit Role**:
   - Update `scripts/scan-banned-patterns.js` and `.github/workflows/security-ci.yml` so that forbidden patterns trigger a non-zero exit code on pull requests as required by AGENT-8.
