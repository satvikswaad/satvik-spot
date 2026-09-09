# STORAGE ARCHITECTURE & PRODUCT IMAGE HANDLING

**Project**: Satwik Sweets and Pickels  
**Scope**: Product Image Storage Strategy & Feature-Gated Upload Infrastructure  
**Date**: July 19, 2026  

---

## 1. Storage Architecture Overview

- **Current Assets Strategy**: Controlled same-origin asset references (`/assets/mango-pickle.jpg`, `/assets/amla-murabba.jpg`).
- **Production Upload Feature Gate**: `ENABLE_STORAGE_UPLOADS = false` until live Cloud Storage bucket configuration is authorized.

---

## 2. Storage Upload Security Specifications

When Cloud Storage upload is enabled:
- **Validation**: Strict MIME type checking (`image/jpeg`, `image/png`, `image/webp`), max file size 2MB. Executable / SVG uploads rejected.
- **Pathing**: Unique UUID paths (`/products/{uuid}.jpg`).
- **Security Rules**: Uploads restricted to `request.auth.token.admin == true && request.auth.token.roles.hasAny(['owner', 'catalog_manager'])`.

---
*End of Storage Architecture Document.*
