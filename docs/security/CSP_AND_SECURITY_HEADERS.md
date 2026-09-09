# CONTENT SECURITY POLICY AND SECURITY HEADERS

**Project**: Satwik Sweets and Pickels  
**Scope**: Public Storefront & Private Admin Portal HTTP Security Headers  
**Date**: July 19, 2026  

---

## 1. Production Content Security Policy (CSP)

Configured via `firebase.json` headers across both `public/site` and `public/admin` hosting targets:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://www.gstatic.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com http://127.0.0.1:*; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests;
```

### Directives Breakdown:
- **`default-src 'self'`**: Restricts all fallback resources to same origin.
- **`script-src 'self' https://www.gstatic.com https://apis.google.com`**: Permits application scripts and Firebase Web SDK CDN files only. **No `unsafe-eval` or `unsafe-inline` allowed.**
- **`style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`**: Allows local stylesheets and Google Fonts.
- **`font-src 'self' https://fonts.gstatic.com`**: Allows local and Google Fonts files.
- **`img-src 'self' https: data:`**: Restricts image sources to HTTPS and base64 data strings.
- **`connect-src`**: Restricts API connections to Firebase/Google services and local emulators in development.
- **`frame-ancestors 'none'`**: Prevents framing on third-party sites (Clickjacking defense).
- **`object-src 'none'`**: Disables Flash, Java applets, and legacy plugins.

---

## 2. Additional HTTP Security Headers

| Header Name | Configured Value | Security Purpose |
| :--- | :--- | :--- |
| `X-Content-Type-Options` | `nosniff` | Blocks MIME-type sniffing attacks. |
| `X-Frame-Options` | `DENY` | Prevents framing and clickjacking. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage on cross-origin requests. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Disables unneeded browser APIs. |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates browsing context. |
| `Cross-Origin-Resource-Policy` | `same-origin` | Blocks cross-site resource loading. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforces HTTPS connection for 1 year. |

---

## 3. Trusted Types Evaluation (Section F)

- **Status**: Evaluated & Prepared (`require-trusted-types-for 'script'`).
- **Compatibility Note**: Firebase Web v10 modular SDK loads external script tags from `gstatic.com`. Full enforcement enabled once custom Trusted Types policy callback is registered for Firebase SDK scripts.

---
*End of Content Security Policy and Security Headers Guide.*
