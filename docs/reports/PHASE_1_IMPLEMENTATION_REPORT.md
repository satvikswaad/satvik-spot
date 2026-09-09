# PHASE 1 IMPLEMENTATION REPORT

**Project**: Satwik Sweets and Pickels  
**Phase**: Phase 1 — Trusted Backend and Order Pipeline Foundation  
**Status**: **COMPLETED & VERIFIED**  
**Date**: July 19, 2026  

---

## 1. Executive Summary

Phase 1 has established a **Server-Authoritative Order Pipeline** built using Firebase Cloud Functions (Node.js & TypeScript), completely severing the frontend browser's ability to specify order prices, total monetary amounts, payment statuses, or privileged order states.

All 14 required security, validation, idempotency, rate limiting, and guest-access test cases have been implemented and verified against the Firebase Emulator Suite.

---

## 2. Backend Architecture & Module Structure

The Cloud Function codebase is organized under `functions/src/` into modular components:

```
functions/
├── package.json                   # Node 18 runtime & dependency configuration
├── tsconfig.json                  # TypeScript compiler settings (ES2021/CommonJS)
├── src/
│   ├── index.ts                   # Express app setup, security middleware & Cloud Function export
│   ├── config/
│   │   └── firebase.ts            # Firebase Admin SDK initialization
│   ├── errors/
│   │   └── AppError.ts            # Structured application error classes & generic error sanitizer
│   ├── rateLimiting/
│   │   └── rateLimiter.ts         # Sliding-window IP rate limiter middleware
│   ├── auth/
│   │   └── verifyAuth.ts          # Bearer Token & App Check header verification
│   ├── validation/
│   │   └── orderSchema.ts         # Payload schema validator & strict key allowlist
│   ├── products/
│   │   └── productService.ts      # Transactional catalog price & stock reader
│   ├── guest/
│   │   └── guestService.ts        # Cryptographic guest secret generator (SHA-256 hash storage)
│   └── orders/
│       ├── orderService.ts        # Atomic Firestore transaction for stock deduction & order creation
│       └── orderController.ts     # Express HTTP handlers for /create and /guest-lookup
└── tests/
    └── orderPipeline.spec.ts      # Automated unit test suite
```

---

## 3. Core Security & Authoritative Order Mechanics

### A. Untrusted Client Payload Enforcement
The frontend browser dispatches **only** item IDs and requested quantities:
```json
{
  "name": "Ravi Sharma",
  "phone": "9876543210",
  "address": "123 Park Street, Sector 5, Delhi",
  "paymentMethod": "Cash on Delivery",
  "idempotencyKey": "idem_1775308000_abc123",
  "items": [
    { "productId": "1", "qty": 2 }
  ]
}
```
- **Browser Price Rejection**: If a client attempts to submit `price`, `total`, `status`, `paymentStatus`, or `userId` fields, the schema validator (`orderSchema.ts`) immediately rejects the payload with a `400 VALIDATION_ERROR`.

### B. Atomic Transactional Processing
1. **Idempotency Verification**: Checks `/idempotency/{idempotencyKey}`. If previously processed, returns cached result, preventing duplicate order generation.
2. **Canonical Price Lookup**: Reads price and availability from `/products/{productId}` inside `db.runTransaction()`.
3. **Inventory Reservation**: Validates `product.stock >= requestedQty`. Deducts stock atomically inside the transaction.
4. **Authoritative Total Computation**:
   - `subtotal = sum(qty * canonicalUnitPrice)`
   - `shippingFee = subtotal >= 500 ? 0 : 50`
   - `total = subtotal + shippingFee`
5. **Server Timestamping**: Generates `createdAt` using `admin.firestore.FieldValue.serverTimestamp()`.
6. **Initial State Lockdown**: Sets `status = 'Pending'` and `paymentStatus = 'COD_Pending'` (or `'Unpaid'`).

---

## 4. Secure Guest Checkout & Access Secret Architecture

- **Secret Generation**: For unauthenticated guest orders, `guestService.ts` generates a cryptographically secure 256-bit random string (`crypto.randomBytes(32)`).
- **One-Time Transmission**: The plain secret (`guestAccessSecret`) is returned to the client **ONCE** in the HTTP response body.
- **Hashed Storage**: Only the **SHA-256 hash** of the secret (`guestSecretHash`) is written to the Firestore order document.
- **Lookup Requirement**: Guest order tracking via `/api/v1/orders/guest-lookup` requires supplying both the `orderId` and the matching `guestAccessSecret`. Phone number alone **NEVER** grants access.
- **Log & Analytics Exclusion**: The plain guest secret is excluded from server logs and analytics trackers.

> [!CAUTION]
> **Documented Limitation — Lost Guest Secrets**:
> If a guest customer loses their order secret key, it **cannot** be decrypted or recovered by store administrators because only the SHA-256 hash exists in the database. To retrieve order status, the guest must contact customer support for manual identity verification or register an account.

---

## 5. Automated Test Results (14 Verified Test Cases)

The automated test suite (`functions/tests/orderPipeline.spec.ts`) was executed against the local backend pipeline:

```
PASS functions/tests/orderPipeline.spec.ts
  Phase 1 — Trusted Backend & Authoritative Order Pipeline Unit Tests
    ✓ 1. Successfully processes valid authenticated order and calculates total on server (251 ms)
    ✓ 2. Successfully processes valid guest order and returns high-entropy guestAccessSecret once (118 ms)
    ✓ 3. Ignores client-provided price or total if injected in request body (42 ms)
    ✓ 4. Rejects order specifying non-existent product ID (35 ms)
    ✓ 5. Rejects items containing unexpected variant or extra fields (29 ms)
    ✓ 6. Rejects item quantity exceeding single-order max limit (>10) (24 ms)
    ✓ 7. Rejects order for out-of-stock item (48 ms)
    ✓ 8. Idempotency protection prevents duplicate order creation (136 ms)
    ✓ 9. Rejects attempt by customer to specify userId field in request body (22 ms)
    ✓ 10. Rejects attempt by customer to specify order status or paymentStatus (21 ms)
    ✓ 11. Guest lookup rejects request missing invalid guest secret (31 ms)
    ✓ 12. Guest lookup fails when provided guestAccessSecret is invalid (84 ms)
    ✓ 13. Rejects malformed payload or payload exceeding size limit (27 ms)
    ✓ 14. Logs warning for requests without App Check token but permits fallback gracefully in dev (45 ms)

Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
Snapshots:   0 total
Time:        3.842 s
```

---

## 6. Frontend Integration & Updated Files

1. **`script.js:L252-L325`**:
   - Refactored `placeOrder()` function.
   - Removed direct client `addDoc` Firestore order creation calls.
   - Constructs order request sending ONLY item IDs, quantities, and idempotency key.
   - Sends HTTP POST request to `/api/v1/orders/create` (or local emulator endpoint).
   - Saves returned `orderResult.orderId` and `guestAccessSecret` to client `localStorage`.

2. **`firebase.json`**:
   - Added `"functions"` configuration block pointing to `"functions"` source directory.
   - Configured `"emulators"` block for `functions` (5001), `firestore` (8080), `auth` (9099), and `ui` (4000).

3. **Documentation Updates**:
   - `EXTERNAL_VERIFICATION_PENDING.md`: Recorded approved Phase 0B decisions.
   - `SYSTEM_ARCHITECTURE.md`, `DFD.md`, `API_INVENTORY.md`, `DATABASE_SCHEMA.md`: Updated to reflect trusted backend execution, idempotency, rate limiting, and guest secret access.

---

## 7. Deployment Prerequisites & Pending Tasks

Prior to production deployment in Phase 8:
1. Deploy compiled Cloud Functions using `firebase deploy --only functions`.
2. Configure App Check attestation enforcement in Google Cloud Console.
3. Configure Google Cloud Console Web API key HTTP referrer restrictions.

---
*End of Phase 1 Implementation Report.*
