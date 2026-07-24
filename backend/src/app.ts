import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import { corsMiddleware } from './config/cors';
import { rateLimiter } from './rateLimiting/rateLimiter';
import { verifyAuth } from './auth/verifyAuth';
import { requireAdmin, requireRecentAuthentication } from './auth/adminMiddleware';
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

import { AppError, PaymentsNotAvailableError } from './errors/AppError';
import { envConfig } from './config/environment';
import { logger } from './utils/logger';

export const app = express();

// Disable unnecessary x-powered-by header
app.disable('x-powered-by');

// Configure trusted proxy safely for Render (1 hop reverse proxy)
app.set('trust proxy', 1);

// Register CORS and Body Parser with strict 50KB limit
app.use(corsMiddleware);
app.use(express.json({ limit: '50kb' }));

// Serve static frontend assets for local development / testing
const publicSiteDir = path.resolve(__dirname, '../../public/site');
const publicAdminDir = path.resolve(__dirname, '../../public/admin');
app.use(express.static(publicSiteDir));
app.use('/admin', express.static(publicAdminDir));

// Global Security Response Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
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
app.post('/api/v1/orders/create', handleCreateOrder);
app.post('/api/v1/orders/create-whatsapp-request', handleCreateWhatsAppOrder);
app.post('/api/v1/orders/submit-utr', submitUtrHandler);
app.post('/api/v1/orders/guest-lookup', handleGuestLookup);
app.post('/api/v1/messages', handleCreateMessage);
app.get('/api/v1/reviews', handleGetApprovedReviews);
app.post('/api/v1/reviews', handleCreateReview);

// Customer Profile & Address Management Endpoints
app.get('/api/v1/customer/profile', handleGetCustomerProfile);
app.put('/api/v1/customer/profile', handleUpdateCustomerProfile);
app.get('/api/v1/customer/addresses', handleGetSavedAddresses);
app.post('/api/v1/customer/addresses', handleAddSavedAddress);
app.put('/api/v1/customer/addresses/:addressId', handleUpdateSavedAddress);
app.delete('/api/v1/customer/addresses/:addressId', handleDeleteSavedAddress);
app.get('/api/v1/customer/orders', handleGetCustomerOrders);

// ── PROTECTED ADMIN DASHBOARD API ENDPOINTS ────────────────────────────────
app.get('/api/v1/admin/dashboard-summary', requireAdmin, getDashboardSummary);
app.post('/api/v1/admin/products', requireAdmin, createAdminProduct);
app.post('/api/v1/admin/products/:productId/archive', requireAdmin, requireRecentAuthentication(900), archiveAdminProduct);
app.patch('/api/v1/admin/products/:productId/stock', requireAdmin, updateAdminStock);
app.put('/api/v1/admin/products/:productId/variants', requireAdmin, requireRecentAuthentication(900), updateAdminVariants);
app.post('/api/v1/admin/orders/:orderId/transition', requireAdmin, requireRecentAuthentication(900), transitionOrderStatus);
app.post('/api/v1/admin/orders/:orderId/verify-payment', requireAdmin, requireRecentAuthentication(900), verifyPaymentAdmin);
app.post('/api/v1/admin/messages/:messageId/status', requireAdmin, updateMessageStatus);
app.post('/api/v1/admin/reviews/:reviewId/moderate', requireAdmin, moderateReview);
app.get('/api/v1/admin/audit-events', requireAdmin, requireRecentAuthentication(900), getAuditLogs);

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
