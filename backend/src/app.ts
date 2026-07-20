import express, { Request, Response, NextFunction } from 'express';
import { corsMiddleware } from './config/cors';
import { rateLimiter } from './rateLimiting/rateLimiter';
import { verifyAuth } from './auth/verifyAuth';
import { requireAdmin } from './auth/adminMiddleware';
import { handleCreateOrder, handleGuestLookup } from './orders/orderController';
import { handleCreateMessage } from './messages/messageController';
import { handleCreateReview } from './reviews/reviewController';
import { healthRouter } from './routes/healthRoutes';

import {
  getDashboardSummary,
  createAdminProduct,
  archiveAdminProduct,
  updateAdminStock,
  transitionOrderStatus,
  updateMessageStatus,
  moderateReview,
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

// Health & Readiness Endpoints (Do not require auth token or rate limiting)
app.use(healthRouter);

// Global Rate Limiter & Bearer Auth Verification
app.use(rateLimiter);
app.use(verifyAuth);

// Staging/Development Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  if (!envConfig.publicIndexingEnabled) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
});

// Authoritative Order & Public Endpoints
app.post('/api/v1/orders/create', handleCreateOrder);
app.post('/api/v1/orders/guest-lookup', handleGuestLookup);
app.post('/api/v1/messages', handleCreateMessage);
app.post('/api/v1/reviews', handleCreateReview);

// Payment Endpoint — Protected by PAYMENTS_ENABLED server gate
app.post('/api/v1/payments/process', (_req: Request, _res: Response, next: NextFunction) => {
  if (!envConfig.paymentsEnabled) {
    return next(new PaymentsNotAvailableError());
  }
  return next(new PaymentsNotAvailableError('Payment processing gateway is not configured.'));
});

// ── PROTECTED ADMIN DASHBOARD API ENDPOINTS ────────────────────────────────
app.get('/api/v1/admin/dashboard-summary', requireAdmin, getDashboardSummary);
app.post('/api/v1/admin/products', requireAdmin, createAdminProduct);
app.post('/api/v1/admin/products/:productId/archive', requireAdmin, archiveAdminProduct);
app.patch('/api/v1/admin/products/:productId/stock', requireAdmin, updateAdminStock);
app.post('/api/v1/admin/orders/:orderId/transition', requireAdmin, transitionOrderStatus);
app.post('/api/v1/admin/messages/:messageId/status', requireAdmin, updateMessageStatus);
app.post('/api/v1/admin/reviews/:reviewId/moderate', requireAdmin, moderateReview);
app.get('/api/v1/admin/audit-events', requireAdmin, getAuditLogs);

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
