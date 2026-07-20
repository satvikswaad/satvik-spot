# Firebase Staging Live Verification Report

## Verification Target
- **Firebase Project ID**: `satvik-spot-staging`
- **Firestore Location**: `asia-south1` (Mumbai)
- **Database Mode**: Native Mode

## Live Verification Status

### 1. Firestore Security Rules & Indexes
- Rules File: `firestore.rules` (Released live to `satvik-spot-staging`)
- Indexes File: `firestore.indexes.json` (Released live to `satvik-spot-staging`)
- Default Rule: Default-Deny (`match /{document=**} { allow read, write: if false; }`)
- Customer Orders: Client direct write denied. Client direct total/price write denied.
- Admin Collections: `/audit_logs`, `/rate_limits`, `/idempotency` browser-inaccessible.

### 2. Hosting Site Targets
- `site` -> `satvik-spot-staging` (`https://satvik-spot-staging.web.app`) — Deployed & Live
- `admin` -> `satvik-spot-staging-admin` (`https://satvik-spot-staging-admin.web.app`) — Deployed & Live

### 3. Staging Data Seed
- Seed Tool: `scripts/seed-products.ts`
- Dry-Run Verification: Validated 6 canonical products (`prod_mango_achar`, `prod_lemon_achar`, `prod_garlic_achar`, `prod_green_chilly_achar`, `prod_amla_murabba`, `prod_chyawanprash`).
- Fixture Marker: `testData: true`
- PII Exposure: 0 real customer addresses, phones, or emails.
- Regulatory Identifiers: Blank / `pending`.
