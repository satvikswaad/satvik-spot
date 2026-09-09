# PROJECT DISCOVERY REPORT (REVISED)

**Project Name**: Satwik Sweets and Pickels (Satvik Spot)  
**Target Domain**: Pure Taste of Tradition – Handmade Achars, Murabbas & Herbal Products  
**Date of Inspection**: July 19, 2026 (Revised)  
**Inspection Scope**: Local codebase files located in `u:/SatvikSwad`  

---

## 1. Executive Summary

Satwik Sweets and Pickels is a client-side web application designed for an e-commerce storefront selling traditional Indian pickles, sweet preserves, and Ayurvedic health formulations. 

The application is hosted via **Firebase Hosting** and relies on **Firebase Web SDK (v10.8.0)** for Authentication and Cloud Firestore. Detailed codebase inspection has revealed critical security vulnerabilities in authorization rules, client-side authentication bypasses, unauthoritative order calculation pipelines, and isolated local storage data flows.

---

## 2. Updated Codebase & Documentation Inventory

```
u:/SatvikSwad/
├── ADMIN_PROVISIONING_GUIDE.md       # [NEW] Guide for Admin SDK custom claim provisioning
├── API_INVENTORY.md                  # [REVISED] Endpoint inventory, backend APIs & key hygiene
├── DATABASE_SCHEMA.md                # [REVISED] Firestore dictionary & owner decision requirements
├── DFD.md                            # [REVISED] Level 0, Level 1, and Level 2 Data Flow Diagrams
├── EXTERNAL_VERIFICATION_PENDING.md  # [REVISED] Owner decisions & infrastructure verification
├── FIRESTORE_RULES_DRAFT.md          # [NEW] Draft production rules & Emulator test suite
├── IMPLEMENTATION_ROADMAP.md         # [REVISED] Master 10-phase security-first roadmap
├── PROJECT_DISCOVERY_REPORT.md       # [REVISED] Master project discovery report
├── SECURITY_AND_QUALITY_GAP_REPORT.md# [REVISED] Detailed security gaps & XSS analysis
├── SECURITY_THREAT_MODEL.md          # [REVISED] Expanded STRIDE matrix & abuse protection
├── SYSTEM_ARCHITECTURE.md            # [REVISED] Server-authoritative pipeline architecture
├── USER_AND_ADMIN_FLOW.md            # [REVISED] Customer and admin interaction workflows
├── .firebase/                        # Firebase hosting cache
├── .firebaserc                       # Firebase project configuration
├── admin-dashboard.html              # Admin Dashboard interface
├── admin-login.html                  # Admin Login page
├── assets/                           # Media assets (15 image files)
├── firebase-config.js                # Firebase Web SDK initialization
├── firebase.json                     # Firebase Hosting and Firestore configuration
├── firestore.indexes.json            # Firestore composite index definitions
├── firestore.rules                   # Existing Cloud Firestore security rules
├── index.html                        # Main storefront landing page
├── my-orders.html                    # Customer order tracking page
├── reviews.html                      # Customer reviews & ratings page
├── script.js                         # Main storefront JavaScript logic
├── style.css                         # Global stylesheet
└── user-login.html                   # User authentication & registration page
```

---

## 3. Critical Confirmed Security Findings

1. **Individual Firestore Authorization Failures**:
   - `allow read: if true;` on `/orders`: Exposes all customer PII to the public.
   - `allow update, delete: if request.auth != null;` on `/orders`: Permits any authenticated user to edit or delete any customer's order.
   - `allow read, write: if request.auth != null;` on `/admin`: Allows non-admin logged-in users to access administrative database scopes.
   - `allow update, delete: if request.auth != null;` on `/reviews`: Allows any user to tamper with or wipe reviews.
   - `allow create: if true;` on `/orders`, `/reviews`, `/messages`: Enables unlimited anonymous spamming and database quota exhaustion.

2. **Insecure Client-Side Admin Authentication**:
   - Credentials checked via string comparison in `admin-login.html:L215`.
   - Access gated by `sessionStorage.setItem('satvikAdmin', 'true')` in `admin-dashboard.html:L888`, easily bypassed via browser console.

3. **Untrusted Order Calculation**:
   - `script.js:L270` computes unit prices and total values in client browser JS memory before sending to Firestore.

4. **Isolated Local Data Pipelines**:
   - Contact form (`script.js:L345`) writes inquiries to `localStorage['satvikMessages']`, preventing admin receipt.
   - Product updates in `admin-dashboard.html:L1102` modify runtime memory only and do not persist to Firestore.

---
*End of Revised Project Discovery Report.*
