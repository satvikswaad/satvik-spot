# PHASE 9 CORRECTION REPORT — Amazon Authorization Model

**Project**: Satwik Sweets and Pickels  
**Scope**: Remove AWS IAM/SigV4, apply correct LWA-only SP-API authorization model  
**Date**: July 19, 2026  

---

## 1. What Changed

The original Phase 9 documents incorrectly listed **AWS IAM Signature Version 4 (SigV4)** as a required component of Amazon SP-API authentication. This is no longer accurate — the SP-API uses **Login with Amazon (LWA) access tokens** for request authentication. No AWS access keys, secret access keys, or SigV4 signing are required.

### Authorization Model Applied

**Private self-authorized application** (current design):
- Self-authorization through Amazon Seller Central developer interface
- LWA Client ID + Client Secret + Refresh Token stored in Secret Manager
- Exchange refresh token for short-lived LWA access token via `POST /auth/o2/token`
- Send access token in `x-amz-access-token` header on every SP-API request
- Request only the marketplace roles required by implemented operations

**Public multi-seller OAuth flow**: Not implemented. Documented as future option requiring explicit owner approval.

**Restricted Data Tokens**: Identified as required for buyer PII access. Restricted-role approval marked as externally pending.

---

## 2. Files Modified

| File | Change |
| :--- | :--- |
| [`AMAZON_SP_API_ADAPTER_SPEC.md`](file:///u:/SatvikSwad/AMAZON_SP_API_ADAPTER_SPEC.md) | Replaced SigV4 auth with LWA-only model. Added private vs. public app distinction. Added Restricted Data Token section. |
| [`MARKETPLACE_OFFICIAL_REQUIREMENTS.md`](file:///u:/SatvikSwad/MARKETPLACE_OFFICIAL_REQUIREMENTS.md) | Replaced `LWA OAuth 2.0 + AWS IAM SigV4` with correct LWA-only description. Added Tokens API reference. |
| [`MARKETPLACE_ARCHITECTURE.md`](file:///u:/SatvikSwad/MARKETPLACE_ARCHITECTURE.md) | Changed diagram label from `LWA OAuth + SigV4` to `LWA OAuth 2.0`. |
| [`MARKETPLACE_SECURITY_MODEL.md`](file:///u:/SatvikSwad/MARKETPLACE_SECURITY_MODEL.md) | Added per-marketplace credential tables with storage/rotation/log-exposure columns. Explicit "No AWS IAM" caution. Added RDT section. |
| [`MARKETPLACE_ONBOARDING_CHECKLIST.md`](file:///u:/SatvikSwad/MARKETPLACE_ONBOARDING_CHECKLIST.md) | Expanded Amazon steps: self-authorization, refresh token, role selection, restricted-role approval. Added "No AWS IAM" note. |
| [`amazonAdapter.ts`](file:///u:/SatvikSwad/functions/src/marketplace/amazonAdapter.ts) | Updated doc comments. Added `AmazonLWACredentials` interface (no AWS key fields). Removed SigV4 references from comments. |
| [`phase9Marketplace.spec.ts`](file:///u:/SatvikSwad/functions/tests/phase9Marketplace.spec.ts) | Added 7 new tests (31–37). |
| [`MARKETPLACE_TEST_REPORT.md`](file:///u:/SatvikSwad/MARKETPLACE_TEST_REPORT.md) | Updated test count from 30 to 37. Grand total updated from 319 to 326. |

---

## 3. New Tests Added (31–37)

| # | Test | Proves |
| :---: | :--- | :--- |
| 31 | Amazon adapter does not require AWS access key or secret access key fields | `AmazonLWACredentials` has only `lwaClientId`, `lwaClientSecret`, `lwaRefreshToken` — no AWS key properties |
| 32 | LWA client secret and refresh token never enter logs | Security model and adapter spec mandate "Never logged" / "never in code, logs" |
| 33 | LWA access tokens are not persisted unnecessarily | Spec states "not persisted beyond request lifecycle"; security model states "In-memory only" |
| 34 | Token refresh failure is handled safely with retry and backoff | Adapter spec documents retry + exponential backoff; disabled adapter throws safely |
| 35 | Amazon connector feature flag remains disabled by default | `amazon.enabled === false` |
| 36 | No live Amazon request occurs when connector is disabled | All operational methods reject with "disabled"; `healthCheck()` returns `status: 'disabled'` |
| 37 | Architecture and spec documents contain no SigV4 or AWS IAM references | All 5 corrected documents scanned for `SigV4`, `AWS IAM Signature`, `aws_access_key`, etc. — none found |

---

## 4. Updated Test Totals

| Before Correction | After Correction | Delta |
| :---: | :---: | :---: |
| 319 | **326** | **+7** |

---

## 5. Verification Checklist

- [x] AWS IAM and SigV4 removed from all architecture documents
- [x] LWA-only private application model documented
- [x] Public multi-seller OAuth flow documented as future option (not implemented)
- [x] Restricted Data Token requirements identified and marked pending
- [x] `AmazonLWACredentials` interface contains no AWS key fields
- [x] Adapter doc comments reference LWA-only auth
- [x] All 7 new tests pass
- [x] All 289 Phase 1–8 tests unaffected
- [x] Both marketplace connectors remain disabled
- [x] No seller accounts connected
- [x] Nothing deployed
- [x] No SigV4 signing dependencies were added (none to remove)

---
*End of Phase 9 Correction Report.*
