# Render Staging Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Satvik Spot backend Web Service to Render's staging environment using Application Default Credentials (ADC) and Render Secret Files.

## Prerequisites
1. Dedicated Staging Firebase Project: `satvik-spot-staging`
2. Staging Firebase Service Account JSON key
3. Private GitHub Repository: `https://github.com/satvikswaad/satvik-spot.git`
4. Render Account

## Deployment Steps

### Step 1: Push Code to Staging Branch
Ensure all Phase 10A changes are committed to the private GitHub repository:
```bash
git remote add origin https://github.com/satvikswaad/satvik-spot.git
git branch -M main
git push -u origin main
```

### Step 2: Create Render Web Service
1. Log into the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository `satvikswaad/satvik-spot`.
4. Configure Web Service details:
   - **Name**: `satvik-spot-backend-staging`
   - **Region**: Singapore (`singapore`)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node 22
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`

### Step 3: Add Firebase Credentials via Secret File
1. In the Web Service settings menu, navigate to **Secret Files**.
2. Click **Add Secret File**.
3. Set **Filename**: `firebase-service-account.json`.
4. Paste the JSON contents of your staging Firebase service account key.
5. Save the file. Render mounts secret files under `/etc/secrets/firebase-service-account.json`.

### Step 4: Configure Non-Secret Environment Variables
Under **Environment Variables**, add:
- `NODE_ENV`: `staging`
- `PORT`: `8080`
- `GOOGLE_APPLICATION_CREDENTIALS`: `/etc/secrets/firebase-service-account.json`
- `CORS_ALLOWED_ORIGINS`: `https://satvik-spot-staging.web.app,https://satvik-spot-staging-admin.web.app,http://localhost:3000,http://127.0.0.1:3000`
- `COMMERCE_ENABLED`: `false`
- `CHECKOUT_ENABLED`: `false`
- `PAYMENTS_ENABLED`: `false`
- `MARKETPLACE_AMAZON_ENABLED`: `false`
- `MARKETPLACE_FLIPKART_ENABLED`: `false`
- `FSSAI_STATUS`: `pending`
- `GST_STATUS`: `pending`
- `PUBLIC_INDEXING_ENABLED`: `false`

### Step 5: Deploy & Verify
1. Click **Manual Deploy** -> **Deploy latest commit**.
2. Monitor build logs. Confirm no secrets are exposed in logs.
3. Test health checks:
   - `GET https://<render-service-url>/health` -> Expect HTTP 200 `{ status: "healthy" }`
   - `GET https://<render-service-url>/ready` -> Expect HTTP 200 `{ status: "ready" }`
