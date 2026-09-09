# Environment Boundary Matrix

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Multi-Environment Architecture & Strict Configuration Rules  

---

## 1. Multi-Environment Comparison Matrix

| Configuration Dimension | `local` / `development` | `test` (Emulator) | `staging` (Active) | `production` (Planned) |
| :--- | :--- | :--- | :--- | :--- |
| **Firebase Project ID** | `satvik-spot-staging` (or local) | `satvik-spot-staging` | `satvik-spot-staging` | `satwiksweetsandpickels` (Unprovisioned) |
| **Customer Hosting Origin** | `http://localhost:5000` | `http://127.0.0.1:5000` | `https://satvik-spot-staging.web.app` | `https://satwikspot.com` (Placeholder) |
| **Admin Hosting Origin** | `http://localhost:5001` | `http://127.0.0.1:5001` | `https://satvik-spot-staging-admin.web.app` | `https://admin.satwikspot.com` (Placeholder) |
| **API Base URL** | `http://localhost:8080` | `http://127.0.0.1:8080` | `https://satvik-spot-backend-staging.onrender.com` | `https://api.satwikspot.com` (Placeholder) |
| **Allowed CORS Origins** | `localhost:3000`, `5000`, `8080`, `127.0.0.1` | `127.0.0.1:3000`, `5000`, `8080` | `https://satvik-spot-staging.web.app`, `...admin.web.app` | `https://satwikspot.com`, `https://admin.satwikspot.com` |
| **Firestore Target** | Local Emulator / Staging DB | Firestore Emulator (Port 8080) | GCP Managed Cloud Firestore (Staging) | GCP Managed Cloud Firestore (Prod) |
| **Emulators Permitted?** | **YES** | **YES** | **NO** (Rejected by config check) | **NO** (Rejected by config check) |
| **Localhost CORS Allowed?**| **YES** | **YES** | **NO** (Filtered in production check) | **NO** (Strictly rejected on boot) |
| **Debug Logging Enabled?** | **YES** | **YES** | **REDACTED JSON ONLY** | **REDACTED JSON ONLY** |
| **Commerce Enabled?** | **FALSE** | **FALSE** | **FALSE** | **FALSE** |
| **Checkout Enabled?** | **FALSE** | **FALSE** | **FALSE** | **FALSE** |
| **Payments Enabled?** | **FALSE** | **FALSE** | **FALSE** | **FALSE** |
| **Required Secrets** | Service account JSON (Local) | None (Emulator auto-auth) | `/etc/secrets/firebase-service-account.json` | Production Service Account JSON |
| **Startup Fail Behavior** | Warning / Fallback to local | Fallback to emulator | **FAIL CLOSED** on missing service key file | **FAIL CLOSED** on missing key, HTTP CORS, or bad domain |

---

## 2. Production Fail-Closed Safety Rules

1. **Localhost Rejection**: If `NODE_ENV === 'production'`, any CORS origin containing `localhost` or `127.0.0.1` causes `validateStartupConfig()` to fail startup.
2. **Insecure HTTP Rejection**: Production CORS origins starting with `http://` cause server boot failure.
3. **Staging Domain Rejection**: Production CORS origins containing `satvik-spot-staging` cause server boot failure.
4. **Wildcard Origin Rejection**: Any environment attempting to configure `CORS_ALLOWED_ORIGINS=*` causes server boot failure.
5. **Commerce Feature Gates**: `COMMERCE_ENABLED`, `CHECKOUT_ENABLED`, and `PAYMENTS_ENABLED` default to `false` and reject non-boolean inputs.
