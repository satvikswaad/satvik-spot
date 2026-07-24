# Phase 2 — Trust Boundary and Data Flow Analysis

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: End-to-End System Network Boundaries & Data Flow Analysis  

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client Layer (Untrusted Browser Environment)
        CustBrowser["Customer Browser<br/>(satvik-spot-staging.web.app)"]
        AdminBrowser["Admin Browser<br/>(satvik-spot-staging-admin.web.app)"]
    end

    subgraph CDN & Hosting Layer (Firebase Hosting)
        HostSite["Hosting Target: site<br/>(public/site)"]
        HostAdmin["Hosting Target: admin<br/>(public/admin)"]
    end

    subgraph Cloud Identity & Data Layer (Google Cloud / Firebase)
        FirebaseAuth["Firebase Authentication<br/>(Tokens + Custom Claims)"]
        FirestoreDB["Cloud Firestore Database<br/>(firestore.rules: Default Deny)"]
    end

    subgraph Authoritative Application Backend Layer (Render)
        RenderAPI["Render Node.js 22 Express API<br/>(satvik-spot-backend.onrender.com)"]
        SecretMount["/etc/secrets/firebase-service-account.json<br/>(Server Secret File)"]
    end

    CustBrowser -->|HTTPS GET| HostSite
    AdminBrowser -->|HTTPS GET| HostAdmin

    CustBrowser -->|HTTPS API POST/GET| RenderAPI
    AdminBrowser -->|HTTPS API POST/PATCH + Bearer Token| RenderAPI

    CustBrowser -->|Auth SDK Login/Register| FirebaseAuth
    AdminBrowser -->|Auth SDK Login + Admin Claim| FirebaseAuth

    CustBrowser -->|Client SDK Read Approved Products/Reviews| FirestoreDB
    
    SecretMount -->|Initializes Admin SDK| RenderAPI
    RenderAPI -->|Admin SDK Privileged Reads/Writes| FirestoreDB
    RenderAPI -->|Verifies Admin ID Tokens| FirebaseAuth
```

---

## 2. Comprehensive Trust Boundary Matrix

| Data Flow ID | Source | Destination | Protocol | Authentication | Authorization | App Check Status | Data Categories | Transport Encryption | Rate Limiting | Logging | Failure Behavior | Environment Restrictions | Residual Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Flow 1** | Customer Browser | Firebase Hosting (`public/site`) | HTTPS (TLS 1.3) | None | Public | N/A | Static HTML/CSS/JS/Images | TLS Enforced (HSTS) | CDN Standard | Firebase Hosting Logs | 404 / SPA index fallback | Staging & Prod separated | Browser asset caching |
| **Flow 2** | Admin Browser | Firebase Hosting (`public/admin`) | HTTPS (TLS 1.3) | None (Static HTML fetch) | Public (HTML load) | N/A | Static Admin HTML/JS bundle | TLS Enforced (HSTS) | CDN Standard | Firebase Hosting Logs | 404 / SPA index fallback | Staging & Prod separated | Admin portal URL is public knowledge |
| **Flow 3** | Customer Portal | Render API (`/api/v1/orders/...`) | HTTPS (TLS 1.3) | Optional / Anonymous | Public Endpoint Gate | Emulator Fallback Allowed | Order payloads, guest lookups | TLS Enforced | 100 req / 15 min per IP | Redacted JSON Logs | 400 Bad Request / 503 Disabled | CORS restricted to customer origin | IP spoofing via proxies |
| **Flow 4** | Admin Portal | Render API (`/api/v1/admin/...`) | HTTPS (TLS 1.3) | Bearer Firebase ID Token | `admin: true` Custom Claim | Emulator Fallback Allowed | Dashboard stats, orders, stock, audit logs | TLS Enforced | 100 req / 15 min per IP | Redacted JSON Logs | 401 Unauthorized / 403 Forbidden | CORS restricted to admin origin | Stolen admin ID token before expiration |
| **Flow 5** | Browser Client | Firebase Auth | HTTPS (TLS 1.3) | User Credentials | Firebase Auth Internal | Enforced in Prod | Email, password hash, ID tokens | TLS Enforced | Managed by Google | Firebase Internal Logs | Auth Error Code (400/401) | Staging project isolated | Weak user password |
| **Flow 6** | Customer Browser | Firestore Client SDK | HTTPS (WSS / TLS 1.3) | Unauth / Auth User | `firestore.rules` | Enforced in Prod | Approved products, approved reviews | TLS Enforced | Managed by Google | Firestore Internal Logs | Permission Denied (403) | Direct writes denied by rules | Malicious client query floods |
| **Flow 7** | Render Backend | Firebase Admin SDK | Internal IPC | Service Account Certificate | Full Admin Privilege | N/A (Server Internal) | User claims, token verification | Internal TLS | N/A | Server Redacted Logs | Startup Fail-Closed | Service account key mounted on server | Compromised service account key |
| **Flow 8** | Render Backend | Cloud Firestore | gRPC / TLS 1.3 | Service Account Auth | Full Admin Privilege | N/A (Server Internal) | Orders, inventory, audit logs, messages | TLS Enforced | N/A | Server Redacted Logs | 503 Readiness Fail | Connection retry with backoff | Firestore quota limits |
| **Flow 9** | Render Load Balancer | Render API (`/health`, `/ready`)| HTTP/HTTPS | None | None | N/A | System status, uptime | TLS / Internal | None (Bypasses rate limiter) | Minimal log | 503 Not Ready | Minimal non-sensitive JSON output | DDoS on readiness ping |
| **Flow 10**| GitHub Actions | Render / Firebase | HTTPS | GitHub OIDC / Deployment Secrets | Repository Write Access | N/A | Source code, build artifacts | TLS Enforced | GitHub Standard | GitHub Action Audit Logs | Workflow Fail | Staging & Prod deployment secrets separated | Workflow script tampering |
| **Flow 11**| Local Developer | Firebase Emulators | HTTP / Local TCP | Emulator Tokens | Local Rule Evaluation | Disabled in Emulator | Test mock documents | Unencrypted Localhost | None | Local Debug Console | Log Error to terminal | `127.0.0.1` only | Emulator port exposed to local network |

---

## 3. Input Validation and Trust Boundary Crossings

Untrusted client data enters trusted backend boundary at:
1. `POST /api/v1/orders/create`: Validated via `orderSchema` (zod/express validation).
2. `POST /api/v1/orders/guest-lookup`: Phone number & order ID sanitized before querying.
3. `POST /api/v1/messages`: Input sanitized via `sanitizeText` / validation.
4. `POST /api/v1/reviews`: Sanitized and forced `approved: false` by server.
5. `POST /api/v1/admin/*`: Verified via `requireAdmin` middleware checking `decodedToken.admin === true`.
