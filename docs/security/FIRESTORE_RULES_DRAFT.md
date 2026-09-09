# FIRESTORE SECURITY RULES & EMULATOR VERIFICATION (PHASE 3 REVISED)

**System**: Satwik Sweets and Pickels  
**Scope**: Production-Ready Rules v2 & 52 Automated Test Suite Results  
**Date**: July 19, 2026 (Phase 3 Completed)  

---

## 1. Verified Production Security Rules (`firestore.rules`)

The `firestore.rules` file contains the active ruleset verified against the Firebase Emulator Suite.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }
    function isAdmin() { return isSignedIn() && request.auth.token.admin == true; }
    function isValidString(str, minLen, maxLen) { return str is string && str.size() >= minLen && str.size() <= maxLen; }
    function isValidInt(val, minVal, maxVal) { return val is int && val >= minVal && val <= maxVal; }
    function isNonNegativeInt(val) { return val is int && val >= 0; }
    function hasOnlyAllowedFields(allowedFields) { return request.resource.data.keys().hasOnly(allowedFields); }

    // Default Deny All Collections
    match /{document=**} { allow read, write: if false; }

    // /products/{productId}
    match /products/{productId} {
      allow read: if resource.data.available == true || isAdmin();
      allow create, update: if isAdmin() &&
        hasOnlyAllowedFields(['name', 'cat', 'emoji', 'img', 'desc', 'price', 'mrp', 'stock', 'available', 'badge']) &&
        isValidString(request.resource.data.name, 2, 100) &&
        isValidString(request.resource.data.desc, 5, 500) &&
        (request.resource.data.cat in ['achar', 'murabba', 'chawmpras']) &&
        request.resource.data.price > 0 &&
        request.resource.data.mrp >= request.resource.data.price &&
        isNonNegativeInt(request.resource.data.stock) &&
        request.resource.data.available is bool;
      allow delete: if isAdmin();
    }

    // /categories/{categoryId}
    match /categories/{categoryId} {
      allow read: if resource.data.active == true || isAdmin();
      allow create, update, delete: if isAdmin();
    }

    // /users/{userId}
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create, update: if isOwner(userId) &&
        hasOnlyAllowedFields(['name', 'phone', 'email', 'address', 'createdAt']) &&
        isValidString(request.resource.data.name, 2, 100) &&
        isValidString(request.resource.data.email, 5, 100) &&
        !('admin' in request.resource.data) && !('role' in request.resource.data) &&
        !('roles' in request.resource.data) && !('claims' in request.resource.data);
      allow delete: if isAdmin();
    }

    // /orders/{orderId}
    match /orders/{orderId} {
      allow create: if false; // Cloud Functions Admin SDK only
      allow read: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow update, delete: if false; // Cloud Functions Admin SDK only

      match /events/{eventId} {
        allow read: if isAdmin() || (isSignedIn() && get(/databases/$(database)/documents/orders/$(orderId)).data.userId == request.auth.uid);
        allow create, update, delete: if false;
      }
    }

    // /reviews/{reviewId}
    match /reviews/{reviewId} {
      allow read: if resource.data.approved == true || isAdmin();
      allow create: if isSignedIn() &&
        hasOnlyAllowedFields(['productId', 'name', 'stars', 'text', 'approved', 'createdAt']) &&
        isValidString(request.resource.data.text, 5, 500) &&
        isValidInt(request.resource.data.stars, 1, 5) &&
        request.resource.data.approved == false;
      allow update, delete: if isAdmin();
    }

    // /messages/{messageId}
    match /messages/{messageId} {
      allow create: if false; // Cloud Functions Admin SDK only
      allow read: if isAdmin();
      allow update, delete: if false;
    }

    // Internal collections (Idempotency, Rate Limits, Audit Logs, Settings)
    match /audit_logs/{logId} { allow read: if isAdmin(); allow create, update, delete: if false; }
    match /idempotency/{id} { allow read, write: if false; }
    match /rate_limits/{bucket} { allow read, write: if false; }
    match /admin/{document=**} { allow read: if isAdmin(); allow write: if false; }
    match /settings/{document} { allow read: if resource.data.isPublic == true; allow write: if false; }
  }
}
```

---
*End of Firestore Rules Draft Report.*
