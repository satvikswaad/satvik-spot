# Firebase Hosting Staging Deployment Report

## Overview
This document records the live deployment execution and verification of the dual Firebase Hosting targets to the staging project `satvik-spot-staging`.

## Hosting Target Mapping & Live Deployment Status

| Target Name | Local Public Path | Staging Domain URL | Live HTTP Status | Verification |
| :--- | :--- | :--- | :--- | :--- |
| `site` | `public/site` | `https://satvik-spot-staging.web.app` | HTTP 200 | Live Verified |
| `admin` | `public/admin` | `https://satvik-spot-staging-admin.web.app` | HTTP 200 | Live Verified |

## Deployment Commands Executed
```bash
# Target site deployment
npx firebase deploy --only hosting:site --project satvik-spot-staging

# Target admin deployment
npx firebase deploy --only hosting:admin --project satvik-spot-staging
```

## Security & Content Verification
- **Public Target (`site`)**: Verified live with `<meta name="robots" content="noindex, nofollow" />` and sticky warning banner (`id="staging-banner"`: `⚠️ Staging — test system | Development data — not for sale`). Excludes all admin pages.
- **Admin Target (`admin`)**: Verified live on separate domain (`https://satvik-spot-staging-admin.web.app`). Login container rendered; requires Firebase Auth + `admin: true` claim for data access.
- **Content Security Policy**: Restricts script sources, disables `object-src`, and sets `connect-src` to `https://satvik-spot-backend-staging.onrender.com` and Firebase APIs.
