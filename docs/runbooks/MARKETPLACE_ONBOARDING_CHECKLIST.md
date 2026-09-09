# MARKETPLACE ONBOARDING CHECKLIST

**Project**: Satwik Sweets and Pickels  
**Scope**: Step-by-Step Pre-Activation Requirements for Amazon India & Flipkart  
**Date**: July 19, 2026 (Corrected: Amazon authorization model updated)  

---

## 1. Amazon India Onboarding

| Step | Requirement | Status |
| :--- | :---: | :--- |
| 1 | Register Amazon Seller Central India account | `OWNER ACTION REQUIRED` |
| 2 | Complete Business/GSTIN/Bank account verification | `OWNER ACTION REQUIRED` |
| 3 | Apply for Food & Grocery category approval | `OWNER ACTION REQUIRED` |
| 4 | Provide FSSAI Licence Number in seller profile | `OWNER ACTION REQUIRED` |
| 5 | Register SP-API developer application in Seller Central (obtain LWA Client ID and Client Secret) | `OWNER ACTION REQUIRED` |
| 6 | Complete self-authorization to obtain LWA Refresh Token | `OWNER ACTION REQUIRED` |
| 7 | Store LWA Client ID, Client Secret, and Refresh Token in Secret Manager | `OWNER ACTION REQUIRED` |
| 8 | Request only required marketplace roles (Listings, Orders, Feeds, Reports) | `OWNER ACTION REQUIRED` |
| 9 | If restricted buyer data is needed for fulfilment, apply for restricted-role approval | `SELLER_ACCOUNT_APPROVAL_PENDING` |
| 10 | Enable Amazon connector feature flag | `OWNER ACTION REQUIRED` |
| 11 | Submit test listing via SP-API sandbox | Pending steps 1–10 |
| 12 | Verify listing attribute compliance | Pending step 11 |
| 13 | Go-live with inventory sync | Pending step 12 |

> [!NOTE]
> No AWS IAM credentials, access keys, or Signature Version 4 signing are required. SP-API requests use LWA access tokens obtained by exchanging the refresh token.

---

## 2. Flipkart India Onboarding

| Step | Requirement | Status |
| :--- | :---: | :--- |
| 1 | Register Flipkart Seller Hub account | `OWNER ACTION REQUIRED` |
| 2 | Complete Business/GSTIN/Bank account verification | `OWNER ACTION REQUIRED` |
| 3 | Apply for Food & Grocery category approval | `OWNER ACTION REQUIRED` |
| 4 | Provide FSSAI Licence Number in seller profile | `OWNER ACTION REQUIRED` |
| 5 | Obtain Seller API OAuth credentials | `OWNER ACTION REQUIRED` |
| 6 | Store OAuth credentials in Secret Manager | `OWNER ACTION REQUIRED` |
| 7 | Enable Flipkart connector feature flag | `OWNER ACTION REQUIRED` |
| 8 | Submit test listing via API sandbox | Pending steps 1–7 |
| 9 | Verify listing attribute compliance | Pending step 8 |
| 10 | Go-live with inventory sync | Pending step 9 |

> [!IMPORTANT]
> No live marketplace account, credential, or listing operation has been performed. All steps above require explicit owner authorization and satisfaction of all 12 gates in [`COMMERCE_ACTIVATION_CHECKLIST.md`](file:///u:/SatvikSwad/COMMERCE_ACTIVATION_CHECKLIST.md).

---
*End of Marketplace Onboarding Checklist.*
