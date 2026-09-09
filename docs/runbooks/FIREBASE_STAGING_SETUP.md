# Firebase Staging Setup Specification

## Overview
This document specifies the setup, location selection, authentication configuration, App Check staging registration, and Firestore rules deployment for the dedicated staging Firebase project.

## Staging Project Details
- **Project ID**: `satvik-spot-staging`
- **Firebase Project Alias**: `staging`
- **Firestore Location**: `asia-south1` (Mumbai, India)
- **Render Region**: `singapore` (Singapore)
- **Latency**: ~35ms roundtrip between Singapore backend and Mumbai Firestore.
- **Location Permanence**: Location selected during database creation is permanent and cannot be changed after data exists.

## Firebase Authentication Setup
- Auth Provider: Email/Password & Phone Auth (Testing mode enabled).
- Authorized Domains:
  - `satvik-spot-staging.firebaseapp.com`
  - `satvik-spot-staging.web.app`
  - `localhost`
  - `127.0.0.1`

## Firestore Database Configuration
- Mode: Firestore Native Mode
- Security Rules: Default-Deny Security Rules (`firestore.rules`)
- Indexes: Single & Composite Indexes (`firestore.indexes.json`)

## Deployment Commands (Explicit Staging Alias)
```bash
# 1. Target explicit staging alias
npx firebase deploy --only firestore:rules,firestore:indexes --project staging

# 2. Deploy preflight check
npm run preflight
```
> [!CAUTION]
> Deployment scripts must always pass `--project staging` explicitly to prevent accidental deployment to production or unintended Firebase projects.
