# Service Account and Deployment Boundary Review

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: GCP Service Accounts, Render Backend Environment, Firebase Hosting Targets, Origin Isolation  

---

## 1. Executive Security Boundary Evaluation

| Security Boundary | Target Standard | Current Implementation | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Service Account Storage** | Zero private keys in Git | Service account JSONs ignored via `.gitignore` and absent from Git history. | **PASSED** | `git log -S "PRIVATE KEY"`, `.gitignore` lines 16–17 |
| **Render Credential Injection**| Server-side secret file | Injected at runtime via `/etc/secrets/firebase-service-account.json`. | **PASSED** | `.env.example` line 7, `backend/src/config/firebase.ts` |
| **Client Bundle Isolation** | Zero backend secrets in browser | `public/site` and `public/admin` contain only public Web SDK config (`apiKey: "AIzaSy..."`). | **PASSED** | `backend/tests/phase10RenderBackend.spec.ts` test 24 |
| **Hosting Target Separation** | Separate customer vs admin sites | `hosting:site` -> `public/site`<br/>`hosting:admin` -> `public/admin` | **PASSED** | `firebase.json` lines 3–5, 58–59 |
| **Cloud Functions Separation** | Render sole backend | `"functions"` target removed from `firebase.json` deployment block. | **PASSED** | `firebase.json` updated; `backend/` is active Render backend |
| **Environment Origin Boundaries**| Isolated CORS & CSP | Staging origins (`satvik-spot-staging.web.app`) isolated from production origins. | **PASSED** | `backend/src/config/environment.ts` line 46, `firebase.json` CSP headers |
| **Render Deployment Control** | Manual trigger during hardening | Auto-Deploy disabled on Render dashboard. | **PASSED** | `RENDER_DEPLOYMENT_REPORT.md` |

---

## 2. Least-Privilege Architecture

```mermaid
graph TD
    subgraph Browser Frontend Layer (Firebase Hosting)
        Site["Customer Storefront<br/>(public/site)<br/>satvik-spot-staging.web.app"]
        Admin["Admin Portal<br/>(public/admin)<br/>satvik-spot-staging-admin.web.app"]
    end

    subgraph Application Server Layer (Render)
        Backend["Render Node.js 22 Express Backend<br/>(satvik-spot-backend.onrender.com)"]
        SecretFile["/etc/secrets/firebase-service-account.json<br/>(Mounted Server Secret Only)"]
    end

    subgraph Firebase Cloud Managed Services
        Auth["Firebase Authentication<br/>(Custom Claim: admin=true)"]
        Firestore["Cloud Firestore<br/>(firestore.rules: Default Deny)"]
    end

    Site -->|Unauthenticated / Session Calls| Backend
    Admin -->|Firebase ID Token + Admin Claim| Backend
    SecretFile -->|Initializes Admin SDK| Backend
    Backend -->|Server-Authoritative Writes| Firestore
    Backend -->|Verifies Admin ID Tokens| Auth
    Site -->|Public Read-Only Data| Firestore
```

---

## 3. Strict Deployment Rules

1. **Production Deployment Prohibition**: No automated or manual commands may deploy to production during Phase 1.
2. **Secrets Storage**: Server service account keys must **never** be stored in environment variables printed to console or committed to Git.
3. **CORS Strictness**: Backend endpoints reject cross-origin requests from unapproved origins.
