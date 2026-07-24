# Security Headers and CSP Report

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Firebase Hosting Security Headers & Express API Security Response Headers  

---

## 1. Firebase Hosting Security Headers Matrix

| Security Header | Customer Storefront (`public/site`) | Admin Portal (`public/admin`) | Purpose / Security Function | Verified Status |
| :--- | :--- | :--- | :--- | :--- |
| **Content-Security-Policy** | Restricts scripts, styles, fonts, images, connect targets to Google/Firebase/Render | Same strict policy; no unapproved origins | Prevents XSS, data exfiltration, unauthorized script execution | **PASSED** |
| **Strict-Transport-Security** | `max-age=31536000; includeSubDomains` | `max-age=31536000; includeSubDomains` | Enforces HTTPS strictly for 1 year | **PASSED** |
| **X-Content-Type-Options** | `nosniff` | `nosniff` | Blocks MIME-type sniffing | **PASSED** |
| **X-Frame-Options** | `DENY` | `DENY` | Prevents clickjacking framing attacks | **PASSED** |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | `strict-origin-when-cross-origin` | Minimizes referrer information leaks | **PASSED** |
| **Permissions-Policy** | `camera=(), microphone=(), geolocation=(), payment=()` | `camera=(), microphone=(), geolocation=(), payment=()` | Disables risky browser APIs | **PASSED** |
| **X-Robots-Tag** | Default / `noindex` in staging | `noindex, nofollow, noarchive` | Prevents search engine indexing of admin portal | **PASSED** |
| **Cache-Control** | Standard asset caching | `no-store, no-cache, must-revalidate` | Prevents caching of sensitive admin HTML/JS | **PASSED** |

---

## 2. Express Backend API Response Headers

- **`x-powered-by`**: Disabled (`app.disable('x-powered-by')`) to prevent server technology disclosure.
- **`X-Content-Type-Options`**: Set to `nosniff` on all JSON API responses.
- **`X-Frame-Options`**: Set to `DENY` on all API endpoints.
- **`Strict-Transport-Security`**: `max-age=31536000; includeSubDomains` set on all backend endpoints.
- **`X-Robots-Tag`**: `noindex, nofollow` enforced on backend endpoints when `PUBLIC_INDEXING_ENABLED=false`.

---

## 3. CSP Directive Deep-Dive & Explicit Future-Phase Findings

### CSP Directive Breakdown
1. **`script-src`**: `'self' https://www.gstatic.com https://apis.google.com` (Firebase Web SDK required domains).
2. **`style-src`**: `'self' 'unsafe-inline' https://fonts.googleapis.com` (Google Fonts & inline styles).
   - **Google Fonts Requirement**: Google Fonts CSS stylesheets require `https://fonts.googleapis.com`. Google Fonts does **not** inherently require `'unsafe-inline'`.
   - **Exact Code Instances Requiring `'unsafe-inline'`**:
     - Inline `style="..."` attributes in HTML templates (e.g. `public/site/index.html` hero banner background styling, card containers, and modal layout overrides).
     - Dynamic DOM `.style` property mutations in JavaScript (`public/site/script.js` hero slide opacity/transform transitions, marquee animation calculations, and dynamic badge positioning).
3. **`frame-ancestors`**: `'none'` (Strictly prevents site framing in all browsers).

---

## 4. Explicit Future-Phase Security Findings & Tracking

The following security enhancements are explicitly tracked for future phases:

- **Production App Check Enforcement**: Deferred to **Phase 4** (App Check & Identity Security).
- **Removal of CSP `style-src 'unsafe-inline'`**: Deferred to **Phase 7 / Phase 10** (UI Refactoring & Production Hardening) to refactor inline attributes and dynamic `.style` mutations into CSS classes or nonce-based CSP.
