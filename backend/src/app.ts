import path from 'path';
import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import { corsMiddleware } from './config/cors';
import {
  rateLimiter,
  orderRateLimiter,
  messageRateLimiter,
  reviewRateLimiter,
  guestLookupRateLimiter,
  adminRateLimiter,
  customerRateLimiter
} from './rateLimiting/rateLimiter';
import { enforceSecureCookieHeaders } from './auth/cookieSecurity';
import { verifyAuth } from './auth/verifyAuth';
import { requireAdmin, requireRecentAuthentication, requireAuthenticatedUser } from './auth/adminMiddleware';
import { requireAdminIpAllowlist } from './auth/adminIpFilter';
import { handleCreateOrder, handleCreateWhatsAppOrder, handleGuestLookup, submitUtrHandler } from './orders/orderController';
import { handleCreateMessage } from './messages/messageController';
import { handleCreateReview, handleGetApprovedReviews } from './reviews/reviewController';
import { healthRouter } from './routes/healthRoutes';

import {
  getDashboardSummary,
  createAdminProduct,
  archiveAdminProduct,
  updateAdminStock,
  transitionOrderStatus,
  updateMessageStatus,
  moderateReview,
  updateAdminVariants,
  verifyPaymentAdmin,
  getAuditLogs
} from './admin/adminController';

import {
  createPaymentOrderHandler,
  verifyPaymentHandler,
  webhookHandler,
  refundHandler
} from './payments/paymentController';

import { AppError, PaymentsNotAvailableError } from './errors/AppError';
import { envConfig } from './config/environment';
import { logger } from './utils/logger';

export const app = express();

// Disable unnecessary x-powered-by header
app.disable('x-powered-by');

// Configure trusted proxy safely for Render (1 hop reverse proxy)
app.set('trust proxy', 1);

// Register CORS, Body Parser with strict 50KB limit and rawBody capture for webhooks, and Cookie Security
app.use(corsMiddleware);
app.use(express.json({
  limit: '50kb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(enforceSecureCookieHeaders);

// Serve static frontend assets for local development / testing
const publicSiteDir = path.resolve(__dirname, '../../public/site');
const publicAdminDir = path.resolve(__dirname, '../../public/admin');
app.use(express.static(publicSiteDir));
app.use('/admin', express.static(publicAdminDir));

// Global Security Response Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce;
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://www.gstatic.com https://apis.google.com https://accounts.google.com https://*.google.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://*.firebaseapp.com https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self' https://satvik-spot-backend-staging.onrender.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://accounts.google.com https://*.google.com https://www.gstatic.com https://api.razorpay.com https://lumberjack.razorpay.com http://127.0.0.1:*; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.google.com https://www.google.com/recaptcha/ https://recaptcha.google.com/ https://api.razorpay.com https://checkout.razorpay.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests;`
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  if (!envConfig.publicIndexingEnabled) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
});

// Health & Readiness Endpoints (Do not require auth token or rate limiting)
app.use(healthRouter);

// Payment Endpoint Gate — Rejected with 503 before Auth verification when payments disabled
app.post('/api/v1/payments/process', (_req: Request, _res: Response, next: NextFunction) => {
  if (!envConfig.paymentsEnabled) {
    return next(new PaymentsNotAvailableError());
  }
  return next(new PaymentsNotAvailableError('Payment processing gateway is not configured.'));
});

// Global Rate Limiter & Bearer Auth Verification
app.use(rateLimiter);
app.use(verifyAuth);

import {
  handleGetCustomerProfile,
  handleUpdateCustomerProfile,
  handleGetSavedAddresses,
  handleAddSavedAddress,
  handleUpdateSavedAddress,
  handleDeleteSavedAddress,
  handleGetCustomerOrders
} from './customer/customerController';

// Authoritative Order & Public Endpoints
app.post('/api/v1/orders/create', orderRateLimiter, handleCreateOrder);
app.post('/api/v1/orders/create-whatsapp-request', orderRateLimiter, handleCreateWhatsAppOrder);
app.post('/api/v1/orders/submit-utr', submitUtrHandler);
app.post('/api/v1/orders/guest-lookup', guestLookupRateLimiter, handleGuestLookup);
app.post('/api/v1/messages', messageRateLimiter, handleCreateMessage);
app.get('/api/v1/reviews', handleGetApprovedReviews);
app.post('/api/v1/reviews', reviewRateLimiter, handleCreateReview);

// Razorpay Payment Gateway Endpoints
app.post('/api/v1/payments/create-order', orderRateLimiter, createPaymentOrderHandler);
app.post('/api/v1/payments/verify', orderRateLimiter, verifyPaymentHandler);
app.post('/api/v1/payments/webhook', webhookHandler);

// Customer Profile & Address Management Endpoints
app.use(['/api/v1/customer', '/api/v1/customer/*'], customerRateLimiter, requireAuthenticatedUser);
app.get('/api/v1/customer/profile', handleGetCustomerProfile);
app.put('/api/v1/customer/profile', handleUpdateCustomerProfile);
app.get('/api/v1/customer/addresses', handleGetSavedAddresses);
app.post('/api/v1/customer/addresses', handleAddSavedAddress);
app.put('/api/v1/customer/addresses/:addressId', handleUpdateSavedAddress);
app.delete('/api/v1/customer/addresses/:addressId', handleDeleteSavedAddress);
app.get('/api/v1/customer/orders', handleGetCustomerOrders);

// ── PROTECTED ADMIN DASHBOARD API ENDPOINTS ────────────────────────────────
app.use(['/api/v1/admin', '/api/v1/admin/*'], adminRateLimiter, requireAdminIpAllowlist);
app.get('/api/v1/admin/dashboard-summary', requireAdmin, getDashboardSummary);
app.post('/api/v1/admin/products', requireAdmin, createAdminProduct);
app.post('/api/v1/admin/products/:productId/archive', requireAdmin, requireRecentAuthentication(300), archiveAdminProduct);
app.patch('/api/v1/admin/products/:productId/stock', requireAdmin, updateAdminStock);
app.put('/api/v1/admin/products/:productId/variants', requireAdmin, requireRecentAuthentication(300), updateAdminVariants);
app.post('/api/v1/admin/orders/:orderId/transition', requireAdmin, requireRecentAuthentication(300), transitionOrderStatus);
app.post('/api/v1/admin/orders/:orderId/verify-payment', requireAdmin, requireRecentAuthentication(900), verifyPaymentAdmin);
app.post('/api/v1/admin/refunds', requireAdmin, requireRecentAuthentication(300), refundHandler);
app.post('/api/v1/admin/messages/:messageId/status', requireAdmin, updateMessageStatus);
app.post('/api/v1/admin/reviews/:reviewId/moderate', requireAdmin, moderateReview);
app.get('/api/v1/admin/audit-events', requireAdmin, requireRecentAuthentication(300), getAuditLogs);

// API 404 JSON Handler for unmatched /api routes
app.use('/api', (_req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'API route not found'
    }
  });
});

// Centralized Non-Leaking Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.errorCode}]: ${err.message}`, { statusCode: err.statusCode });
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message
      }
    });
  }

  logger.error('Unhandled internal server error', { error: err.message });
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal server error occurred'
    }
  });
});
