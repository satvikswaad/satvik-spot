# USER AND ADMIN FLOWS (PHASE 2 REVISED)

**Project**: Satwik Sweets and Pickels  
**Scope**: Separate Admin Portal Navigation, Token Claims Verification & Session Controls  
**Date**: July 19, 2026 (Phase 2 Completed)  

---

## 1. Separate Admin Portal Workflow Diagram (Mermaid)

```mermaid
flowchart TD
    AdminStart([Admin Opens Private Portal admin.satwikspot.com]) --> LoginScreen[View Admin Login Form]
    LoginScreen --> SubmitCreds[Enter Email & Password]
    SubmitCreds --> AuthFirebase[Authenticate via Firebase Auth]

    AuthFirebase --> FetchClaims[Execute user.getIdTokenResult true]
    FetchClaims --> CheckAdminClaim{claims.admin == true?}

    CheckAdminClaim -->|No| SignOutUser[Sign Out & Display Access Denied]
    CheckAdminClaim -->|Yes| LoadPortalUI[Render Admin Portal UI]

    LoadPortalUI --> StartTimer[Start 15-Min Inactivity Countdown]
    StartTimer --> SubOrders[Subscribe to Real-time Orders Stream guarded by Firestore Rules]

    StartTimer --> CheckInactivity{13 Mins Inactive?}
    CheckInactivity -->|Yes| ShowWarningModal[Display 2-Minute Logout Warning Modal]
    ShowWarningModal --> StayLoggedIn{Click Stay Logged In?}
    StayLoggedIn -->|Yes| ResetTimer[Reset Inactivity Timer]
    StayLoggedIn -->|No / 15 Mins| AutoLogout[Trigger Automatic Logout & Sign Out]

    LoadPortalUI --> ClickLogout[Click Sign Out]
    ClickLogout --> AutoLogout
```

---

## 2. Public Storefront Workflow (No Admin Exposure)

- Public storefront (`index.html`) contains **zero** admin login buttons, links, or fallback forms.
- All order placement requests flow to the trusted backend pipeline (`/api/v1/orders/create`).

---
*End of Revised User and Admin Flow Document.*
