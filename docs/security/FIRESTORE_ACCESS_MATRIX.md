# FIRESTORE COLLECTION ACCESS MATRIX

**Project**: Satwik Sweets and Pickels  
**Scope**: Complete Role-Based Database Permission Matrix  
**Date**: July 19, 2026  

---

## 1. Role Definitions

- **Public / Unauthenticated**: Unauthenticated visitors browsing the storefront.
- **Customer (Authenticated)**: User signed in via Firebase Auth without administrative custom claims.
- **Administrator**: User signed in via Firebase Auth with verified custom claim `request.auth.token.admin == true`.
- **Trusted Backend (Admin SDK)**: Server execution context (Cloud Functions / Cloud Run) operating with service account credentials (bypasses security rules).

---

## 2. Collection Access Matrix Table

| Collection Path | Public Read | Customer Read | Admin Read | Client Create | Client Update | Client Delete | Backend Write (Admin SDK) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `/products/{productId}` | Active Only | Active Only | All | Admin Only (Validated) | Admin Only | Admin Only | Allowed |
| `/categories/{categoryId}` | Active Only | Active Only | All | Admin Only | Admin Only | Admin Only | Allowed |
| `/users/{userId}` | DENIED | Own Doc | All | Own Doc (Validated) | Own Doc (Validated) | Admin Only | Allowed |
| `/orders/{orderId}` | DENIED | Own Orders | All | **DENIED** | **DENIED** | **DENIED** | **Allowed (Authoritative)** |
| `/orders/{id}/events/{eventId}`| DENIED | Own Order Events | All | **DENIED** | **DENIED** | **DENIED** | Allowed |
| `/reviews/{reviewId}` | Approved Only | Approved Only | All | Customer (Validated) | Admin Only | Admin Only | Allowed |
| `/messages/{messageId}` | DENIED | DENIED | All | **DENIED** | **DENIED** | **DENIED** | Allowed |
| `/audit_logs/{logId}` | DENIED | DENIED | All | **DENIED** | **DENIED** | **DENIED** | **Allowed (Append-Only)** |
| `/idempotency/{id}` | DENIED | DENIED | DENIED | **DENIED** | **DENIED** | **DENIED** | Allowed |
| `/rate_limits/{bucket}` | DENIED | DENIED | DENIED | **DENIED** | **DENIED** | **DENIED** | Allowed |
| `/admin/{document}` | DENIED | DENIED | Admin Only | **DENIED** | **DENIED** | **DENIED** | Allowed |
| `/settings/{document}` | Public Docs | Public Docs | All | **DENIED** | **DENIED** | **DENIED** | Allowed |

---
*End of Firestore Access Matrix Document.*
