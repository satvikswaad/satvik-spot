# Staging Component Rollback Procedure & Record

## Overview
Emergency rollback instructions for each component of the Satvik Spot staging environment.

## 1. Firebase Firestore Security Rules & Indexes Rollback
If a deployed Firestore rule or index causes unexpected client errors or blocks legitimate staging requests:
```bash
# Redeploy verified local rules file to staging
npx firebase deploy --only firestore:rules --project satvik-spot-staging

# Redeploy verified local indexes file to staging
npx firebase deploy --only firestore:indexes --project satvik-spot-staging
```

## 2. Firebase Hosting Rollback (Public & Admin Sites)
If a deployed public or admin frontend build needs immediate rollback:
```bash
# Rollback site target
npx firebase hosting:clone satvik-spot-staging:PREVIOUS_SITE_RELEASE satvik-spot-staging:site --project satvik-spot-staging

# Rollback admin target
npx firebase hosting:clone satvik-spot-staging:PREVIOUS_ADMIN_RELEASE satvik-spot-staging-admin:admin --project satvik-spot-staging
```

## 3. Render Web Service Rollback
If a deployed backend container on Render fails readiness checks:
1. Log into [Render Dashboard](https://dashboard.render.com/).
2. Select service `satvik-spot-backend-staging`.
3. Navigate to **Deploys**.
4. Select the previous successful deployment commit.
5. Click **Rollback to this deploy**.
