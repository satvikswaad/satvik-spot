# Phase 3 — Firestore Identity Boundary Report

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Firestore Security Rules Identity & Custom Claim Boundary Audit  

---

## 1. Firestore Rules Security Model

The Cloud Firestore security configuration (`firestore.rules`) enforces strict server-authoritative boundaries:
- **Default Deny Fallback**: `match /{document=**} { allow read, write: if false; }` at root.
- **Admin Rule Check**: `function isAdmin() { return request.auth != null && request.auth.token.admin == true; }`
- **Client Write Denial**: Clients cannot write custom claims or alter administrative collections directly.

---

## 2. Collection Access Control Summary

| Collection Path | Read Rule | Write Rule | Client SDK Privilege | Risk Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| `/orders/{orderId}` | Owner (`resource.data.userId == auth.uid`) OR `isAdmin()` | **DENIED** (`allow create, update, delete: if false;`) | Read own orders only | Backend API handles order creation & status transitions |
| `/reviews/{reviewId}`| Public approved (`approved == true`) OR `isAdmin()` | **DENIED** | Read approved only | Backend API handles submission & moderation |
| `/products/{productId}`| Public available (`available == true`) OR `isAdmin()` | **DENIED** | Read available only | Backend API handles product management |
| `/messages/{msgId}` | `isAdmin()` | **DENIED** | Read admin only | Backend API handles message creation & status |
| `/audit_logs/{id}` | `isAdmin()` | **DENIED** (`allow create, update, delete: if false;`) | Read admin only | Server Admin SDK writes tamper-proof logs |
| `/admin/{doc}` | `isAdmin()` | **DENIED** | Read admin only | Protected administrative metadata |

---

## 3. Boundary Verification Summary

1. **Client Profile Independence**: Firestore user profile documents `/users/{uid}` do not contain or override administrative claims.
2. **Tamper-Proof Audit Ledger**: Direct client SDK creates, updates, and deletes on `/audit_logs` return `Permission Denied` in Security Rules emulator tests (`functions/tests/firestoreRules.spec.ts`).
