# Customer and Admin Hosting Separation Report

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Scope**: Hosting Target Isolation & Asset Boundary Verification  

---

## 1. Target Separation Architecture

| Target Name | Target Directory | Domain (Staging) | Access Scope | Indexing Policy | Asset Isolation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`site`** | `public/site/` | `https://satvik-spot-staging.web.app` | Customer Public | Public Search Indexable | Zero `admin.js` or admin HTML assets included |
| **`admin`** | `public/admin/` | `https://satvik-spot-staging-admin.web.app` | Admin Restricted | `X-Robots-Tag: noindex, nofollow, noarchive` | Isolated `admin.js` and admin `index.html` |

---

## 2. Boundary Verification Findings

1. **Zero Cross-Linking**: Scanned `public/site/index.html`, `public/site/script.js`, and all storefront HTML files. Confirmed zero links to `admin`, `admin-login`, or `admin-dashboard`.
2. **Robots & Sitemap Hygiene**: `public/site/robots.txt` and `public/site/sitemap.xml` contain zero references to `/admin` or administrative routes.
3. **Targeted Deployment Commands**:
   - Customer Portal: `firebase deploy --only hosting:site`
   - Admin Portal: `firebase deploy --only hosting:admin`
4. **Independent SPA Rewrites**: `firebase.json` defines separate SPA fallback rewrites for `site` (`public/site/index.html`) and `admin` (`public/admin/index.html`), preventing cross-target route leaks.
