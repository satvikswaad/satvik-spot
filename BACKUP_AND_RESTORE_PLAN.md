# BACKUP AND RESTORE PLAN

**Project**: Satwik Sweets and Pickels  
**Scope**: Firestore Database Backup, Storage Asset Backup & Disaster Recovery  
**Date**: July 19, 2026  

---

## 1. Cloud Firestore Backup Strategy

- **Automated Daily Export**: Scheduled Cloud Firestore managed export to Google Cloud Storage bucket (`gs://satwikspot-backups/firestore`).
- **Retention**: Daily backups retained for 30 days; weekly backups retained for 1 year.
- **Export Command**:
  ```bash
  gcloud firestore export gs://satwikspot-backups/firestore-$(date +%Y%m%d)
  ```

---

## 2. Recovery Procedures

1. **Firestore Restoration**:
   ```bash
   gcloud firestore import gs://satwikspot-backups/firestore-[EXPORT_DATE]
   ```
2. **Local Emulator Restoration**:
   ```bash
   npm run restore
   ```

---
*End of Backup and Restore Plan.*
