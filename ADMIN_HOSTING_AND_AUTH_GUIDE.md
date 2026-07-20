# ADMIN HOSTING AND AUTHENTICATION GUIDE

**System**: Satwik Sweets and Pickels  
**Scope**: Separate Admin Portal Hosting, Multi-Target Deployment & Firebase Auth Custom Claims  
**Date**: July 19, 2026  

---

## 1. Hosting Target Separation Architecture

To prevent public exposure of administrative assets, the application uses **Firebase Multi-Site Hosting**:

```
u:/SatvikSwad/
├── firebase.json                     # Configures dual hosting targets ('site' and 'admin')
├── public/
│   ├── site/                         # Public Storefront Target (satwikspot.web.app)
│   │   ├── index.html                # Storefront landing page (ZERO admin links)
│   │   ├── user-login.html           # Customer login page
│   │   ├── my-orders.html            # Customer order lookup page
│   │   ├── reviews.html              # Customer feedback page
│   │   ├── script.js                 # Cart & checkout integration
│   │   └── style.css                 # Public styles
│   └── admin/                        # Private Admin Portal Target (admin.satwikspot.com)
│       ├── index.html                # Secure Admin Portal UI
│       ├── admin.js                  # Admin Auth & Token Refresh handler
│       ├── firebase-config.js        # Admin Firebase Config (session persistence)
│       └── style.css                 # Admin styles
```

---

## 2. Firebase Multi-Site Deployment Commands

```bash
# Apply hosting target aliases to Firebase project (One-time setup)
firebase target:apply hosting site satwiksweetsandpickels
firebase target:apply hosting admin satwiksweetsandpickels-admin

# Deploy Public Storefront Target ONLY
firebase deploy --only hosting:site

# Deploy Private Admin Portal Target ONLY
firebase deploy --only hosting:admin

# Deploy Both Hosting Targets
firebase deploy --only hosting
```

> [!CAUTION]
> **Deployment Guard**: Do **NOT** deploy either hosting target during current development phases until explicit owner approval is given.

---

## 3. Administrative Authorization & Token Lifecycle

1. **Authentication**: Admin signs in at `admin.satwikspot.com` using Firebase Auth email and password (`signInWithEmailAndPassword`).
2. **Force Token Refresh**: Frontend executes `user.getIdTokenResult(true)` to pull custom claims directly from Firebase Auth servers.
3. **Claim Check**: Frontend checks `idTokenResult.claims.admin === true`.
   - If `true`: Renders Admin Portal UI and connects to Firestore streams.
   - If `false`: Signs user out (`auth.signOut()`) and displays "Access Denied".
4. **Backend Enforcement**: Cloud Firestore Security Rules enforce `request.auth.token.admin == true` on `/orders`, `/products`, `/messages`, and `/audit_logs`.

---

## 4. Admin Session & Inactivity Controls

- **Session Persistence**: Configured to `browserSessionPersistence` in `public/admin/firebase-config.js` (cleared when browser tab/window is closed).
- **Inactivity Timer**: 15-minute inactivity countdown. Displays warning modal at 13 minutes. Auto-logs out at 15 minutes.
- **Storage Hygiene**: Zero passwords, ID tokens, or customer data cached in browser `localStorage`.

---
*End of Admin Hosting and Auth Guide.*
