# Firestore Architecture Boundary Report

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Cloud Firestore Security Rules (`firestore.rules`) & Client/Server Access Boundaries  

---

## 1. Firestore Security Boundary Architecture

```mermaid
flowchart LR
    subgraph Untrusted Clients
        Customer["Customer Browser<br/>(Client SDK)"]
        AdminBrowser["Admin Browser<br/>(Client SDK)"]
    end

    subgraph Firebase Cloud Managed Security
        Rules["firestore.rules<br/>(rules_version = '2')<br/>Default Deny: allow read, write: if false;"]
        Firestore["Cloud Firestore Database"]
    end

    subgraph Trusted Backend Layer
        RenderBackend["Render Node.js API<br/>(Firebase Admin SDK)"]
    end

    Customer -->|Subject to Rules| Rules
    AdminBrowser -->|Subject to Rules| Rules
    Rules -->|Allow Approved Public Read / Moderated Read| Firestore
    RenderBackend -->|Bypasses Rules (Server Authoritative)| Firestore
```

---

## 2. Security Rules Access Control Summary

| Collection | Client SDK Read Access | Client SDK Write Access | Server Admin SDK Access | Security Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `products/` | Public read approved items (`approved == true`) | **DENIED** | Full read/write | Prevents customer product price manipulation |
| `reviews/` | Public read approved items (`approved == true`) | **DENIED** (Must submit via backend API) | Full read/write / Moderation | Prevents self-approval of reviews |
| `orders/` | Customer read own orders (`userId == auth.uid`) | **DENIED** (Must create via backend API) | Full read/write / Status transitions | Enforces server-side order calculation & inventory ledger |
| `messages/` | Admin read only (`auth.token.admin == true`) | **DENIED** (Must submit via backend API) | Full read/write | Protects customer inquiry privacy |
| `audit_logs/`| **DENIED** | **DENIED** | Server Write Only | Tamper-proof server audit ledger |
| `rate_limits/`| **DENIED** | **DENIED** | Server Read/Write | Server-managed rate limit buckets |
| `idempotency/`| **DENIED** | **DENIED** | Server Read/Write | Prevents duplicate order processing |
| `admin/` | **DENIED** | **DENIED** | Server Read/Write | Admin metadata & claims provisioning |

---

## 3. Boundary Integrity Verification

1. **Default Deny Fallback**: Confirmed `match /{document=**} { allow read, write: if false; }` at root of `firestore.rules`.
2. **Client SDK Privilege Isolation**: Public client bundles contain zero Firebase Admin SDK credentials.
3. **No Direct Client Order Creation**: Customers cannot bypass backend price/stock validation by writing directly to `/orders`.
