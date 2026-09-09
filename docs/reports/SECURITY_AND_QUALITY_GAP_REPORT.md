# SECURITY AND QUALITY GAP REPORT (REVISED)

**Project**: Satwik Sweets and Pickels  
**Scope**: Expanded Security Deficiencies, Authorization Failures & Code Quality Gaps  
**Date**: July 19, 2026 (Revised)  

---

## 1. Summary of Identified Gaps

| Gap ID | Category | Severity | Description | Code Location |
| :--- | :--- | :--- | :--- | :--- |
| **GAP-SEC-01** | Security | **CRITICAL** | Hardcoded admin credentials (`admin` / plaintext password) & client-side authentication bypass. | `admin-login.html:L215`, `admin-dashboard.html:L888` |
| **GAP-SEC-02** | Security | **CRITICAL** | Public reading of every customer order document (`allow read: if true;`). | `firestore.rules:L8` |
| **GAP-SEC-03** | Security | **CRITICAL** | Any authenticated user can update or delete ANY order (`allow update, delete: if request.auth != null;`). | `firestore.rules:L9` |
| **GAP-SEC-04** | Security | **HIGH** | Any authenticated user can read or write documents in the `/admin` collection. | `firestore.rules:L33` |
| **GAP-SEC-05** | Security | **HIGH** | Any authenticated user can update or delete customer reviews. | `firestore.rules:L22` |
| **GAP-SEC-06** | Security | **HIGH** | Unlimited anonymous creation of orders, reviews, and contact messages (no rate-limiting or bot protection). | `firestore.rules:L7, L21, L27` |
| **GAP-SEC-07** | Security | **HIGH** | Unauthoritative price calculation: client submits prices & totals; no server validation. | `script.js:L270, L304` |
| **GAP-SEC-08** | Security | **HIGH** | Unescaped string concatenation (`innerHTML`) vulnerable to Cross-Site Scripting (XSS). | `admin-dashboard.html:L1031`, `script.js:L76` |
| **GAP-DAT-01** | Data | **HIGH** | Product catalog hardcoded in JS; admin edits do not save to Cloud Firestore. | `admin-dashboard.html:L893`, `script.js:L4` |
| **GAP-FNC-01** | Functional | **HIGH** | Contact form stores messages in local `localStorage` instead of Cloud Firestore. | `script.js:L345`, `admin-dashboard.html:L1230` |
| **GAP-FNC-02** | Functional | **HIGH** | Reviews submitted on `reviews.html` exist only in local memory and vanish on page reload. | `reviews.html:L906` |
| **GAP-DEV-01** | Quality | **MEDIUM** | Missing `package.json`, build bundler, and automated lint/test suites. | Project Root |

---

## 2. Deep-Dive Gap Analysis & Remediation Requirements

### A. Firestore Authorization Failures

1. **GAP-SEC-02: Public Order Exposure**
   - *Issue*: `allow read: if true;` on `/orders` exposes all customer PII to anyone inspecting Firestore endpoints.
   - *Fix*: Limit order reading strictly to verified admins (`request.auth.token.admin == true`) and order owners (`resource.data.userId == request.auth.uid`).

2. **GAP-SEC-03: Global Order Mutation Privilege**
   - *Issue*: `allow update, delete: if request.auth != null;` permits any authenticated buyer to tamper with or delete other customers' orders.
   - *Fix*: Restrict order update and deletion strictly to verified administrators.

3. **GAP-SEC-04: Public Admin Scope Access**
   - *Issue*: `allow read, write: if request.auth != null;` on `/admin` allows non-admin users to modify administrative configuration documents.
   - *Fix*: Require `request.auth.token.admin == true` for `/admin` scope.

4. **GAP-SEC-05: Review Wiping Access**
   - *Issue*: `allow update, delete: if request.auth != null;` on `/reviews` permits arbitrary deletion of feedback.
   - *Fix*: Restrict review updates and deletions to administrators.

5. **GAP-SEC-06: Anonymous Creation & Denial of Service**
   - *Issue*: `allow create: if true;` on `/orders`, `/reviews`, and `/messages` exposes database write quotas to script bots.
   - *Fix*: Implement backend rate limiting, reCAPTCHA v3, App Check, and strict size validation.

---

### B. Admin Role Architecture Gap

- Current code uses hardcoded text checks in `admin-login.html` and sets `sessionStorage['satvikAdmin'] = 'true'`.
- **Requirement**: Implement Firebase Auth custom claims (`admin: true`) provisioned strictly via server-side Firebase Admin SDK. Web browser scripts must never have permission to assign admin status.

---

### C. Untrusted Client Price Calculation Gap

- `script.js` builds order totals from client-side state. A malicious user can alter prices before dispatching the payload.
- **Requirement**: Establish a trusted execution environment (Firebase Cloud Functions / Cloud Run). The client submits product IDs and quantities; the server validates prices, availability, shipping, calculates totals, and creates authoritative order documents.

---

### D. XSS & CSP Remediation Gap

- Multiple template literals directly set `innerHTML` with unsanitized inputs (`o.name`, `o.address`, `m.message`).
- **Requirement**: Use DOM creation methods (`createElement`) and text assignment (`textContent`). Implement a strict Content Security Policy header.

---
*End of Security and Quality Gap Report.*
