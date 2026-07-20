# COMMERCE ACTIVATION CHECKLIST

**Project**: Satwik Sweets and Pickels  
**Scope**: 12 Mandatory Quality & Regulatory Gates Required Before Enabling Online Commerce  
**Date**: July 19, 2026  

---

## Commerce Activation Gates

All 12 gates below must pass with explicit owner confirmation before `COMMERCE_ENABLED` can be set to `true`:

| # | Gate | Requirement | Verification Method | Status |
| :-: | :--- | :--- | :--- | :---: |
| 1 | **FSSAI Licence** | Valid FSSAI registration/licence document received and owner-confirmed | Document inspection by owner | ❌ `PENDING` |
| 2 | **Legal Label Info** | Required legal label info (net weight, ingredients, allergens, shelf life) supplied | Catalog audit | ❌ `PENDING` |
| 3 | **GST Position** | GST registration position confirmed by a qualified professional | Professional advice review | ❌ `PENDING` |
| 4 | **Genuine Catalog** | Genuine products, prices, MRP, ingredients, and photographs supplied | Owner content submission | ❌ `PENDING` |
| 5 | **Legal Policies** | Shipping, refund, privacy policy, and terms of service approved | Legal review | ❌ `PENDING` |
| 6 | **Firebase Billing** | Firebase Blaze plan billing enabled | Firebase Console status | ❌ `PENDING` |
| 7 | **Production Project** | Production Firebase project configured and provisioned | GCP project audit | ❌ `PENDING` |
| 8 | **Admin MFA** | Multi-Factor Authentication enforced on all admin accounts | Firebase Auth settings | ❌ `PENDING` |
| 9 | **App Check** | reCAPTCHA v3 production key registered and enforced | App Check Console | ❌ `PENDING` |
| 10 | **Backup & Monitoring** | Production backup GCS bucket and Cloud Monitoring alerts configured | Cloud Monitoring audit | ❌ `PENDING` |
| 11 | **Staging E2E Tests** | All 336 project tests pass on private staging environment | Automated test execution | ❌ `PENDING` |
| 12 | **Owner Approval** | Explicit written approval recorded from business owner | Signed authorization | ❌ `PENDING` |

> [!CAUTION]
> Setting `COMMERCE_ENABLED=true` without satisfying all 12 gates is strictly prohibited.

---
*End of Commerce Activation Checklist.*
