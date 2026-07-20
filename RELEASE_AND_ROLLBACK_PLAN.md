# RELEASE AND ROLLBACK PLAN (PHASE 10A — COMPLETE)

**Project**: Satwik Sweets and Pickels  
**Scope**: Render Staging/Production Deployment & Rollback Procedures  
**Date**: July 20, 2026  

---

## 1. Controlled Release Checklist (Render + Firebase Staging)

1. Confirm dedicated staging Firebase project ID: `satvik-spot-staging`.
2. Confirm Render Secret File `/etc/secrets/firebase-service-account.json` exists.
3. Deploy Firestore Rules & Indexes to staging explicitly:
   `npx firebase deploy --only firestore:rules,firestore:indexes --project staging`.
4. Push backend code to private repository `https://github.com/satvikswaad/satvik-spot.git`.
5. Trigger Render Web Service build (`npm ci && npm run build`).
6. Verify `/health` (liveness) and `/ready` (readiness) endpoints return HTTP 200.

---

## 2. Emergency Rollback Procedures

```bash
# Render Web Service Rollback:
# In Render Dashboard -> satvik-spot-backend-staging -> Deploys -> Select previous successful deploy -> Rollback.

# Firebase Staging Rules Rollback:
npx firebase deploy --only firestore:rules --project staging
```

---
*End of Release and Rollback Plan.*
