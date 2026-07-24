# Environment Variables Reference

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Server Backend (Render), Customer Storefront, Admin Portal, Test Harnesses  

---

## 1. Complete Environment Variable Inventory

| Variable Name | Purpose | Required / Optional | Scope | Default Value | Secret? | Expected Format / Example | Startup Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `PORT` | Server listening port | Optional | Backend | `8080` | No | Numeric string (`8080`) | Uses `8080` default if missing |
| `NODE_ENV` | Runtime environment tier | Required | Backend / Global | `development` | No | `development` / `staging` / `production` | Falls back to `development` |
| `CORS_ALLOWED_ORIGINS` | Permitted browser origins | Required | Backend | `satvik-spot-staging...` | No | Comma-separated URLs | Uses default staging origins list |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Firebase Admin service account JSON | Required (Prod/Staging) | Backend (Render) | `/etc/secrets/...` | Yes | Path to secret file | **Fails closed** in prod/staging if file absent |
| `COMMERCE_ENABLED` | Master commerce activation gate | Required | Backend | `false` | No | `true` or `false` | Disabled (`false`) |
| `CHECKOUT_ENABLED` | Direct checkout workflow gate | Required | Backend | `false` | No | `true` or `false` | Disabled (`false`) |
| `PAYMENTS_ENABLED` | Payment gateway processing gate | Required | Backend | `false` | No | `true` or `false` | Disabled (`false`) |
| `MARKETPLACE_AMAZON_ENABLED` | Amazon SP-API sync gate | Optional | Backend | `false` | No | `true` or `false` | Disabled (`false`) |
| `MARKETPLACE_FLIPKART_ENABLED` | Flipkart API sync gate | Optional | Backend | `false` | No | `true` or `false` | Disabled (`false`) |
| `PUBLIC_INDEXING_ENABLED` | Search engine indexing gate | Optional | Frontend / Backend | `false` | No | `true` or `false` | Disabled (`false` / `noindex`) |
| `FSSAI_STATUS` | Regulatory license status | Optional | Backend / Display | `pending` | No | `pending` / `applied` / `verified` | Defaults to `pending` |
| `FSSAI_NUMBER` | 14-digit FSSAI registration ID | Optional | Backend / Display | `""` | No | 14-digit numeric string | Validated if present; empty string if missing |
| `GST_STATUS` | GSTIN registration status | Optional | Backend / Display | `pending` | No | `pending` / `applied` / `verified` | Defaults to `pending` |
| `GSTIN` | 15-character GSTIN ID | Optional | Backend / Display | `""` | No | 15-character alphanumeric string | Validated if present; empty string if missing |
| `AMAZON_SP_API_CLIENT_ID` | Amazon SP-API OAuth Client ID | Optional (Secret) | Backend | `""` | Yes | String token | **Fails startup** if Amazon sync enabled but token missing |
| `AMAZON_SP_API_CLIENT_SECRET` | Amazon SP-API OAuth Secret | Optional (Secret) | Backend | `""` | Yes | String token | **Fails startup** if Amazon sync enabled but secret missing |
| `AMAZON_SP_API_REFRESH_TOKEN` | Amazon SP-API OAuth Refresh | Optional (Secret) | Backend | `""` | Yes | String token | **Fails startup** if Amazon sync enabled but refresh token missing |
| `FLIPKART_CLIENT_ID` | Flipkart Seller API Client ID | Optional (Secret) | Backend | `""` | Yes | String token | **Fails startup** if Flipkart sync enabled but client ID missing |
| `FLIPKART_CLIENT_SECRET` | Flipkart Seller API Secret | Optional (Secret) | Backend | `""` | Yes | String token | **Fails startup** if Flipkart sync enabled but secret missing |

---

## 2. Server Startup & Fail-Closed Rules

1. **Missing Service Account File**: In `staging` or `production` environments, if `GOOGLE_APPLICATION_CREDENTIALS` is missing or points to a non-existent file path, the backend **fails startup immediately** and logs a sanitized error:
   ```json
   {"level":"ERROR","timestamp":"...","message":"Startup Validation Failed: GOOGLE_APPLICATION_CREDENTIALS file does not exist."}
   ```
2. **Missing Marketplace Secrets When Enabled**: If `MARKETPLACE_AMAZON_ENABLED=true` or `MARKETPLACE_FLIPKART_ENABLED=true`, missing API tokens cause `validateStartupConfig()` to return `valid: false` and reject server boot.
3. **No Hardcoded Fallback Secrets**: Production credentials are **never** hardcoded in default code branches or fallback variables.
