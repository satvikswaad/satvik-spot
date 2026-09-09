# REGULATORY-PENDING MODE SPECIFICATION

**Project**: Satwik Sweets and Pickels  
**Scope**: Safe Pre-Registration Operating Framework, Identifier Prohibition & Placeholder Protocol  
**Date**: July 19, 2026  

---

## 1. Core Principles

1. **No Fake Identifiers**: Never generate, display, or store random or realistic FSSAI licence numbers, GSTINs, or registration numbers.
2. **Non-Numeric Placeholders**: In development, staging, or pending mode, display `PENDING` as a non-numeric string placeholder.
3. **Application Reference Numbers (ARN)**: An acknowledgment or ARN must never be represented or displayed as an issued licence or registration number.
4. **Independent Verification**: Format validation (e.g. 14-digit FSSAI pattern or 15-character GSTIN pattern) check string syntax only. Verified status requires explicit owner confirmation after inspecting issued documents.

---

## 2. Server-Authoritative Configuration

```typescript
// Controlled strictly via server environment variables
FSSAI_STATUS=pending          # 'pending' | 'applied' | 'verified'
FSSAI_NUMBER=                 # Empty when pending
GST_STATUS=pending            # 'pending' | 'applied' | 'verified'
GSTIN=                        # Empty when pending
COMMERCE_ENABLED=false        # Server-authoritative order block
CHECKOUT_ENABLED=false        # Server-authoritative checkout block
PAYMENTS_ENABLED=false        # Server-authoritative payment block
MARKETPLACE_AMAZON_ENABLED=false
MARKETPLACE_FLIPKART_ENABLED=false
PUBLIC_INDEXING_ENABLED=false
```

---

## 3. Public Display & Brand Story

When operating in public coming-soon mode:
- Brand story and product catalog are visible for informational purposes only.
- Online ordering is disabled.
- Neutral coming-soon message displayed:
  > *"Online ordering will open after required registrations and launch preparations are completed."*
- FSSAI and GSTIN displays show `PENDING`.
- No claim of "FSSAI approved" or "GST registered" until owner confirms issued documents.
- Admin dashboard remains separate and unlinked on a isolated domain (`admin.satwikspot.com`).

---

## 4. Backend Enforcement

- `POST /api/v1/orders/create` returns HTTP 503 `COMMERCE_NOT_AVAILABLE` when `COMMERCE_ENABLED=false`.
- `POST /api/v1/payments/process` returns HTTP 503 `PAYMENTS_NOT_AVAILABLE` when `PAYMENTS_ENABLED=false`.
- Client-side JavaScript or request body flags cannot override server-authoritative environment gates.

---
*End of Regulatory-Pending Mode Specification.*
