# MARKETPLACE SECURITY MODEL

**Project**: Satwik Sweets and Pickels  
**Scope**: Credential Management, Data Protection & Access Control for Marketplace Integrations  
**Date**: July 19, 2026 (Corrected: Amazon authorization model updated)  

---

## 1. Amazon SP-API Credential Set (Private Application)

| Credential | Storage | Rotation | Log Exposure |
| :--- | :--- | :--- | :--- |
| **LWA Client ID** | Secret Manager | Stable (changes only on re-registration) | **Never logged** |
| **LWA Client Secret** | Secret Manager | Manual rotation via Amazon developer console | **Never logged** |
| **LWA Refresh Token** | Secret Manager | Obtained during self-authorization; long-lived | **Never logged** |
| **LWA Access Token** | In-memory only (short-lived) | Auto-refreshed before expiry; not persisted | **Never logged** |

> [!CAUTION]
> **No AWS IAM credentials required.** The adapter does not use AWS access keys, secret access keys, or Signature Version 4 signing. All SP-API requests are authenticated with the LWA access token in the `x-amz-access-token` header.

---

## 2. Flipkart Credential Set

| Credential | Storage | Rotation | Log Exposure |
| :--- | :--- | :--- | :--- |
| **OAuth Client ID** | Secret Manager | Stable | **Never logged** |
| **OAuth Client Secret** | Secret Manager | Manual rotation via Flipkart Seller Hub | **Never logged** |
| **Access Token** | In-memory only (short-lived) | Auto-refreshed before expiry; not persisted | **Never logged** |

---

## 3. General Credential Security Requirements

| Requirement | Implementation |
| :--- | :--- |
| **Secret Storage** | Google Cloud Secret Manager or equivalent approved secret storage only |
| **No Frontend Exposure** | Marketplace tokens never enter frontend bundles, browser JavaScript, or client-readable Firestore collections |
| **No Git Storage** | `.gitignore` excludes all credential files. Pre-commit hooks recommended. |
| **No Log Exposure** | LWA Client Secret, Refresh Token, and Access Tokens are never written to application logs, error messages, or audit trails |
| **Token Lifecycle** | Access tokens are short-lived, held in-memory only for the duration of the API call, and not persisted to any store |
| **Least-Privilege Roles** | Request only the marketplace roles required by implemented operations |
| **Encrypted Transport** | All marketplace API calls over HTTPS/TLS 1.2+ |

---

## 4. Access Control

| Action | Required Authorization |
| :--- | :--- |
| Enable/disable marketplace connector | Owner only (`admin: true` + `owner` role) |
| View connector status | `catalog_manager` or `owner` |
| Trigger manual inventory sync | `catalog_manager` or `owner` |
| View marketplace orders | `order_manager` or `owner` |
| Access settlement data | `owner` only |
| Manage credentials | `owner` only + recent authentication required |

---

## 5. Restricted Data & Buyer PII Protection

- **Amazon Restricted Data Tokens (RDT)**: Operations accessing buyer PII (shipping addresses, buyer names, phone numbers) require a Restricted Data Token obtained via the Tokens API. RDT is requested only for the specific data types needed for fulfilment.
- **Minimum Data Collection**: Buyer PII is collected only when fulfilment genuinely requires it (e.g. self-ship shipping address).
- **Log Redaction**: Marketplace API responses containing buyer addresses, phone numbers, or payment details must be redacted before logging.
- **Retention**: Raw marketplace payloads retained for reconciliation purposes only, with configurable retention expiry (`retentionExpiresAt`).
- **Flipkart Data Protection**: Buyer information handled per Flipkart seller data-protection terms.
- **Emergency Disable**: Owner can immediately disable any connector, stopping all API calls and sync jobs.

---
*End of Marketplace Security Model.*
