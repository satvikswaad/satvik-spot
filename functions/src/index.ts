import * as functions from 'firebase-functions';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { rateLimiter } from './rateLimiting/rateLimiter';
import { verifyAuth } from './auth/verifyAuth';
import { requireAdmin } from './auth/adminMiddleware';
import { handleCreateOrder, handleGuestLookup } from './orders/orderController';
import { handleCreateMessage } from './messages/messageController';
import { handleCreateReview } from './reviews/reviewController';

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

app.use(cors({ origin: true }));
app.use(express.json({ limit: '50kb' })); // 50KB payload limit
app.use(rateLimiter);
app.use(verifyAuth);

// Staging/Development Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  if (!envConfig.publicIndexingEnabled) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
});

// Health Check Endpoint
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', version: 'v1.0.0', runtime: 'Node 22' });
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

export const api = functions.https.onRequest(app);
