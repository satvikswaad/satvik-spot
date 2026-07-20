# Render Backend Migration Specification

## Overview
This document details the architectural migration of the Satvik Spot backend API execution platform from Firebase Cloud Functions to a standalone Node.js 22 + Express application hosted on Render.

## Architectural Changes

### Previous Architecture
- Execution Environment: Firebase Cloud Functions (`firebase-functions` HTTPS request wrapper)
- Entry Point: `functions/src/index.ts`
- Routing: Single Express application wrapped by `functions.https.onRequest(app)`

### New Architecture
- Execution Environment: Standalone Node.js 22 LTS container hosted on Render Web Service
- Entry Point: `backend/src/server.ts` listening on `0.0.0.0:${PORT}`
- Modular Structure:
  - `backend/src/app.ts`: Express app configuration, security headers, CORS allowlist, body parser, routes, error handlers.
  - `backend/src/server.ts`: HTTP listener, startup configuration validation, graceful `SIGTERM`/`SIGINT` shutdown.
  - `backend/src/routes/healthRoutes.ts`: `/health` (liveness) and `/ready` (readiness) endpoints.
  - `backend/src/config/cors.ts`: Dynamic exact-origin CORS allowlist (`CORS_ALLOWED_ORIGINS`).

## Firebase Service Scope
Firebase remains responsible for:
- Firebase Authentication (ID Tokens, Custom Claims)
- Cloud Firestore (Document Database & Transactions)
- Firestore Security Rules & Firestore Indexes
- Firebase App Check (App Check Token Validation)
- Firebase Hosting (Public & Admin Single Page Apps)

## Standalone Backend Layout
```
backend/
  src/
    app.ts
    server.ts
    config/
      environment.ts
      firebase.ts
      cors.ts
    auth/
      verifyAuth.ts
      adminMiddleware.ts
    orders/
      orderController.ts
      orderService.ts
    products/
      productService.ts
    admin/
      adminController.ts
    messages/
      messageController.ts
    reviews/
      reviewController.ts
    rateLimiting/
      rateLimiter.ts
    errors/
      AppError.ts
    audit/
      auditLogger.ts
    marketplace/
      connectorInterface.ts
      amazonAdapter.ts
      flipkartAdapter.ts
    guest/
      guestService.ts
    routes/
      healthRoutes.ts
  tests/
    phase10RenderBackend.spec.ts
  package.json
  tsconfig.json
  jest.config.js
```

## Security & Resilience Guarantees
1. **Server-Authoritative Gates**: `COMMERCE_ENABLED=false`, `PAYMENTS_ENABLED=false`, and `MARKETPLACE_AMAZON_ENABLED=false` enforced on backend routes regardless of client input.
2. **Payload Size Limit**: Express body-parser limit capped at 50KB.
3. **Disabled Headers**: `x-powered-by` header disabled to prevent fingerprinting.
4. **Proxy Safety**: Trusted proxy enabled for Render (`trust proxy = 1`).
