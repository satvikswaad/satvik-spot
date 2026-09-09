# MONITORING AND ALERTING PLAN (PHASE 9 — COMPLETE)

**Project**: Satwik Sweets and Pickels  
**Scope**: Production Observability, Alerting Thresholds & Incident Routing (Including Marketplace)  
**Date**: July 19, 2026  

---

## 1. Core Platform Alerts

| Metric / Signal | Severity | Threshold | Response Action |
| :--- | :---: | :--- | :--- |
| **Cloud Functions 5xx Errors** | **Critical** | > 2% error rate over 5 min | Page lead developer. Check error logs. |
| **Cloud Functions Latency** | **High** | p95 > 5s over 10 min | Investigate slow queries or cold starts. |
| **App Check Denial Spikes** | **High** | > 50 denials in 10 min | Check for bot attacks or misconfigured clients. |
| **Firestore Denied Requests** | **High** | > 20 denied queries in 5 min | Audit security rule evaluation logs. |
| **Auth Failure Spikes** | **Warning** | > 20 failures in 10 min | Check for credential stuffing attempts. |
| **Admin Auth Denial** | **Warning** | > 5 denials in 5 min | Verify admin provisioning or revocation. |
| **Rate Limit Triggers** | **Informational** | > 100 hits in 1 hour | Monitor IP distribution. |
| **Idempotency Conflicts** | **Warning** | > 5 conflicts in 15 min | Inspect client duplicate submission behaviour. |
| **Order Creation Failures** | **High** | > 3 failures in 10 min | Check stock availability and transaction errors. |
| **Inventory Transaction Conflicts** | **Warning** | > 3 conflicts in 15 min | Investigate concurrent admin operations. |

---

## 2. Marketplace Alerts (When Enabled)

| Metric / Signal | Severity | Threshold | Response Action |
| :--- | :---: | :--- | :--- |
| **Marketplace Auth Failure** | **Critical** | Any auth/token failure | Check Secret Manager credentials. Pause connector. |
| **Marketplace Sync Failure** | **High** | > 3 consecutive failures | Check API availability. Review dead-letter queue. |
| **Inventory Sync Stale** | **High** | Last success > 2 hours ago | Trigger manual sync. Check rate limits. |
| **Order Import Failure** | **High** | Any import failure | Check mapping and connector logs. |
| **Settlement Mismatch** | **Warning** | Any reconciliation `mismatch` | Owner reviews settlement report. |
| **Dead-Letter Queue Growth** | **Warning** | > 10 items pending | Manual review of failed events. |
| **Unknown Status Received** | **Informational** | Any `manual_review` event | Review and update status mapping. |

---

## 3. Alert Delivery Configuration

| Setting | Value |
| :--- | :--- |
| **Notification Recipients** | `OWNER INPUT REQUIRED` (email / SMS / PagerDuty) |
| **Escalation Window** | Critical: 5 min, High: 30 min, Warning: 4 hours |
| **False-Positive Mitigation** | Sustained-window thresholds; no single-event Critical alerts except auth failures |

> [!IMPORTANT]
> **External Setup Required**: Alert policies require Google Cloud Monitoring configuration after Firebase project billing is enabled.

---
*End of Monitoring and Alerting Plan.*
