# Staging Database Deployment Report

## Overview
This document records the Firestore database configuration, rules deployment, and product seed verification for the staging environment.

## Database Details
- **Project**: `satvik-spot-staging`
- **Location**: `asia-south1` (Mumbai)
- **Mode**: Native Mode
- **Rules Version**: 2

## Deployed Security Rules Verification
- **Default Rule**: `match /{document=**} { allow read, write: if false; }`
- **Public Product Catalog**: `allow read: if true` for available products
- **User Orders**: Customer can read/create own orders only. Direct client writes to order total, payment status, or inventory strictly forbidden.
- **Admin Collections**: `/audit_logs`, `/rate_limits`, `/idempotency` inaccessible to client SDKs.

## Seed Execution
- Seed Tool: `scripts/seed-products.ts`
- Dry-Run Execution: Verified 0 writes during dry-run.
- Staging Seed Marker: `testData: true` attached to all non-production seeded documents.
- Regulatory Placeholders: `FSSAI_STATUS=pending`, `GST_STATUS=pending`. No fake numeric GSTIN/FSSAI values seeded.
- Customer PII: 0 real customer records or addresses seeded.
