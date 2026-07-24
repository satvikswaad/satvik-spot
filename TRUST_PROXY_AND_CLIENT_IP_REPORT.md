# Trust Proxy and Client IP Report

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Platform**: Render Node.js 22 Service (`satvik-spot-backend`)  

---

## 1. Express Trust Proxy Configuration

- **Setting**: `app.set('trust proxy', 1)` in `backend/src/app.ts`.
- **Hop Count**: Exactly 1 hop (Express evaluates the immediate single reverse proxy hop).
- **Application Behavior**: Local Express integration tests prove that `trust proxy = 1` prevents Express from blindly trusting multi-hop client-prepended `X-Forwarded-For` chains.
- **Live Proxy Verification Requirement**: Configuring `trust proxy = 1` sets the correct application-layer boundary, but complete IP spoofing protection requires verifying live Render edge forwarding behavior—specifically confirming whether Render overwrites or safely appends `X-Forwarded-For`. Local tests prove Express behavior, not live Render infrastructure behavior.

---

## 2. Client IP Derived Values & Security

| Feature | IP Source | Sanitization | Spoofing Risk Evaluation | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Distributed Rate Limiting** | `req.ip` (Express 1-hop trusted IP) | Sanitized regex `/[^a-zA-Z0-9_.-]/g` | Protected at Express layer; requires live Render header audit | `rateLimiter.ts` line 21 |
| **Audit Logging** | `req.ip` | Redacted in logger output | Derived via 1-hop Express evaluation | `logger.ts`, `auditLogger.ts` |
| **Authentication Middleware** | `req.ip` | Evaluated alongside Bearer ID token | N/A (Auth requires valid Firebase ID token) | `verifyAuth.ts` |

---

## 3. Owner & Deployment Verification Action

- [ ] **Live Render Proxy Audit (Owner Action Item #9)**: Inspect live incoming HTTP headers on Render to confirm whether Render overwrites `X-Forwarded-For` with the true client socket address or appends to it, and confirm zero unverified intermediate proxies exist.
