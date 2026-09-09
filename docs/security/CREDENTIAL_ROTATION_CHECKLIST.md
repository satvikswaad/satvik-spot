# Credential Rotation Checklist for System Owner

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Purpose**: Operational procedure for owner-managed credential hygiene and production onboarding.  

> [!IMPORTANT]
> Because no active secrets were exposed in source control or Git history, **emergency credential revocation is not required**. The following checklist outlines standard security maintenance and production credential provisioning steps for the repository owner.

---

## 1. Firebase Web API Key Referrer Restrictions

- [ ] **Step 1.1**: Open [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
- [ ] **Step 1.2**: Select target project: `satvik-spot-staging` (and production project when provisioned).
- [ ] **Step 1.3**: Edit the Browser API Key (`AIzaSy...`).
- [ ] **Step 1.4**: Under **Application Restrictions**, select **HTTP Referrers (web sites)**.
- [ ] **Step 1.5**: Add permitted staging origins:
  - `https://satvik-spot-staging.web.app/*`
  - `https://satvik-spot-staging-admin.web.app/*`
  - `http://localhost:*` (for local development)
- [ ] **Step 1.6**: Under **API Restrictions**, restrict usage to:
  - Firebase Authentication API
  - Cloud Firestore API

---

## 2. Render Server Service Account Key Rotation

- [ ] **Step 2.1**: Open Firebase Console -> Project Settings -> Service Accounts.
- [ ] **Step 2.2**: Click **Generate New Private Key** for the server backend.
- [ ] **Step 2.3**: Open Render Dashboard -> `satvik-spot-backend` service -> **Secret Files**.
- [ ] **Step 2.4**: Update `/etc/secrets/firebase-service-account.json` with the newly generated JSON payload.
- [ ] **Step 2.5**: Revoke and delete the old key in Firebase Console after verifying server health.

---

## 3. GitHub Deployment & Secrets Management

- [ ] **Step 3.1**: Verify repository access model in GitHub (`satvikswaad/satvik-spot` remains Private).
- [ ] **Step 3.2**: Configure GitHub Actions Secrets if automated deployments are enabled in future:
  - `FIREBASE_SERVICE_ACCOUNT_STAGING`
  - `RENDER_DEPLOY_HOOK_URL`
- [ ] **Step 3.3**: Ensure zero plain text secrets are stored in repository variable settings.

---

## 4. Production Onboarding Rotation (When Commerce Activated)

- [ ] **Step 4.1**: Provision fresh Amazon SP-API Client Credentials & Refresh Tokens.
- [ ] **Step 4.2**: Provision fresh Flipkart Seller API OAuth Keys.
- [ ] **Step 4.3**: Add marketplace secrets directly to Render Environment Variables (never commit to `.env`).
