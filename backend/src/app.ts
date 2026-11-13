import path from 'path';
import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import { corsMiddleware } from './config/cors';
import {
  rateLimiter,
  orderRateLimiter,
  payuPaymentRateLimiter,
  messageRateLimiter,
  reviewRateLimiter,
  guestLookupRateLimiter,
  adminRateLimiter,
  customerRateLimiter,
  quoteRateLimiter,
  newsletterRateLimiter
} from './rateLimiting/rateLimiter';
import { enforceSecureCookieHeaders } from './auth/cookieSecurity';
import { originGateMiddleware } from './auth/securityGateService';
import { verifyAuth } from './auth/verifyAuth';
import { requireAdmin, requireRecentAuthentication, requireAuthenticatedUser } from './auth/adminMiddleware';
import { requireAdminIpAllowlist } from './auth/adminIpFilter';
import { requireCloudflareAccess } from './auth/cloudflareAccess';
import { handleCreateOrder, handleCreateWhatsAppOrder, handleGuestLookup, submitUtrHandler } from './orders/orderController';
import { createQuoteHandler } from './orders/quotesController';
import { requireJobSecret, handleTriggerOrderExpiryJob } from './orders/expiryJob';
import { getPublicProducts, getPublicProductById } from './products/productController';
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
  getAuditLogs,
  getAdminOrders,
  getAdminOrderById,
  getAdminOrderEvents,
  getAdminProducts,
  getAdminMessages,
  getAdminReviews,
  getAdminShifts
} from './admin/adminController';

import {
  subscribeNewsletterHandler,
  getNewsletterSubscribersHandler
} from './newsletter/newsletterController';

import {
  startShiftHandler,
  closeShiftHandler,
  sellNowHandler
} from './admin/posController';

import { markRefundedHandler } from './admin/refundsController';

import {
  grantRoleHandler,
  getKillSwitchesHandler,
  updateKillSwitchesHandler
} from './admin/adminRolesController';

import {
  createPaymentOrderHandler,
  verifyPaymentHandler,
  webhookHandler,
  refundHandler,
  createPayUOrderHandler,
  payuResponseHandler
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
// Support URL-encoded bodies for PayU SURL/FURL POST returns
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(enforceSecureCookieHeaders);

// Serve static frontend assets for local development / testing
const publicSiteDir = path.resolve(__dirname, '../../public/site');
const publicAdminDir = path.resolve(__dirname, '../../public/admin');

const routeRewrites: Record<string, string> = {
  '/shop': '/products.html',
  '/products': '/products.html',
  '/cookies-policy': '/cookies-policy.html',
  '/cancellation-policy': '/cancellation-refund-policy.html',
  '/shipping': '/shipping-delivery-policy.html',
  '/shipping-delivery-policy': '/shipping-delivery-policy.html',
  '/terms': '/terms-and-conditions.html',
  '/privacy': '/privacy-policy.html',
  '/our-story': '/our-story.html',
  '/why-us': '/why-us.html',
  '/contact': '/contact.html',
  '/faq': '/faq.html',
  '/reviews': '/reviews.html',
  '/profile': '/profile.html',
  '/cancellation-refund-policy': '/cancellation-refund-policy.html',
  '/terms-and-conditions': '/terms-and-conditions.html',
  '/privacy-policy': '/privacy-policy.html',
  '/cart': '/cart.html'
};

app.use((req: Request, res: Response, next: NextFunction) => {
  const cleanPath = req.path.split('?')[0];
  if (routeRewrites[cleanPath]) {
    return res.sendFile(path.join(publicSiteDir, routeRewrites[cleanPath]));
  }
  next();
});

app.use(express.static(publicSiteDir, { extensions: ['html'] }));
app.use('/admin', express.static(publicAdminDir, { extensions: ['html'] }));

// Global Security Response Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce;
  const cspPolicy = `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://checkout.payu.in https://secure.payu.in https://test.payu.in https://www.gstatic.com https://apis.google.com https://accounts.google.com https://*.google.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://*.firebaseapp.com https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self' https://secure.payu.in https://test.payu.in https://info.payu.in https://satvik-spot-backend-staging.onrender.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://accounts.google.com https://*.google.com https://www.gstatic.com https://api.razorpay.com https://lumberjack.razorpay.com http://127.0.0.1:*; frame-src 'self' https://secure.payu.in https://test.payu.in https://checkout.payu.in https://*.firebaseapp.com https://accounts.google.com https://*.google.com https://www.google.com/recaptcha/ https://recaptcha.google.com/ https://api.razorpay.com https://checkout.razorpay.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://secure.payu.in https://test.payu.in; object-src 'none'; upgrade-insecure-requests;`;
  res.setHeader('Content-Security-Policy', cspPolicy);
  res.setHeader('Content-Security-Policy-Report-Only', cspPolicy);
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

// Origin Gate Middleware (ARCH-6): Drops direct traffic missing valid X-Origin-Auth when ORIGIN_GATE_ENABLED=true or in production
const originSecret = process.env.ORIGIN_AUTH_SECRET || 'dev-fallback-origin-secret-32-bytes!';
app.use('/api', (req, res, next) => {
  if (process.env.ORIGIN_GATE_ENABLED === 'true' || envConfig.originGateEnabled) {
    return originGateMiddleware(originSecret)(req, res, next);
  }
  next();
});

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
app.get('/api/v1/products', getPublicProducts);
app.get('/api/v1/products/:productId', getPublicProductById);
app.post('/api/v1/quotes', quoteRateLimiter, createQuoteHandler);
app.get('/api/v1/quotes', quoteRateLimiter, createQuoteHandler);
app.post('/api/v1/orders/create', orderRateLimiter, handleCreateOrder);
app.post('/api/v1/orders/create-whatsapp-request', orderRateLimiter, handleCreateWhatsAppOrder);
app.post('/api/v1/orders/submit-utr', submitUtrHandler);
app.post('/api/v1/orders/guest-lookup', guestLookupRateLimiter, handleGuestLookup);
app.post('/api/v1/messages', messageRateLimiter, handleCreateMessage);
app.get('/api/v1/reviews', handleGetApprovedReviews);
app.post('/api/v1/reviews', reviewRateLimiter, handleCreateReview);

// Public Newsletter Subscription Endpoint (POST /api/v1/newsletter/subscribe)
app.post('/api/v1/newsletter/subscribe', newsletterRateLimiter, subscribeNewsletterHandler);

// PayU Live / Test Payment Gateway Endpoints (Blueprint Specification)
app.post('/api/v1/payments/payu/create-order', payuPaymentRateLimiter, createPayUOrderHandler);
app.post('/api/billing/payu/create-order', payuPaymentRateLimiter, createPayUOrderHandler);
app.post('/api/v1/payments/payu/response', payuResponseHandler);
app.post('/api/billing/payu/response', payuResponseHandler);

// Razorpay Payment Gateway Endpoints
app.post('/api/v1/payments/create-order', orderRateLimiter, createPaymentOrderHandler);
app.post('/api/v1/payments/verify', orderRateLimiter, verifyPaymentHandler);
app.post('/api/v1/payments/webhook', webhookHandler);

// Background Jobs (ARCH-8)
app.post('/api/v1/jobs/expire-reservations', requireJobSecret, handleTriggerOrderExpiryJob);

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
app.use(['/api/v1/admin', '/api/v1/admin/*'], adminRateLimiter, requireCloudflareAccess, requireAdminIpAllowlist);
app.get('/api/v1/admin/dashboard-summary', requireAdmin, getDashboardSummary);
app.get('/api/v1/admin/orders', requireAdmin, getAdminOrders);
app.get('/api/v1/admin/orders/:orderId', requireAdmin, getAdminOrderById);
app.get('/api/v1/admin/orders/:orderId/events', requireAdmin, getAdminOrderEvents);
app.get('/api/v1/admin/products', requireAdmin, getAdminProducts);
app.post('/api/v1/admin/products', requireAdmin, createAdminProduct);
app.post('/api/v1/admin/products/:productId/archive', requireAdmin, requireRecentAuthentication(300), archiveAdminProduct);
app.patch('/api/v1/admin/products/:productId/stock', requireAdmin, updateAdminStock);
app.put('/api/v1/admin/products/:productId/variants', requireAdmin, requireRecentAuthentication(300), updateAdminVariants);
app.post('/api/v1/admin/orders/:orderId/transition', requireAdmin, requireRecentAuthentication(300), transitionOrderStatus);
app.post('/api/v1/admin/orders/:orderId/verify-payment', requireAdmin, requireRecentAuthentication(300), verifyPaymentAdmin);
app.post('/api/v1/admin/refunds', requireAdmin, requireRecentAuthentication(300), refundHandler);
app.get('/api/v1/admin/messages', requireAdmin, getAdminMessages);
app.post('/api/v1/admin/messages/:messageId/status', requireAdmin, updateMessageStatus);
app.get('/api/v1/admin/reviews', requireAdmin, getAdminReviews);
app.post('/api/v1/admin/reviews/:reviewId/moderate', requireAdmin, moderateReview);
app.get('/api/v1/admin/audit-events', requireAdmin, requireRecentAuthentication(300), getAuditLogs);
app.get('/api/v1/admin/pos/shifts', requireAdmin, getAdminShifts);
app.get('/api/v1/admin/newsletter/subscribers', requireAdmin, getNewsletterSubscribersHandler);

// POS Retail & Counter Management (POS-1 to POS-8, TAX-2, TAX-3)
app.post('/api/v1/admin/pos/shifts/start', requireAdmin, startShiftHandler);
app.post('/api/v1/admin/pos/shifts/:shiftId/close', requireAdmin, closeShiftHandler);
app.post('/api/v1/admin/pos/sell-now', requireAdmin, sellNowHandler);

// Admin Refund Settlement (REFUND-1 to REFUND-4, Decision D7)
app.post('/api/v1/admin/refunds/mark-refunded', requireAdmin, requireRecentAuthentication(300), markRefundedHandler);

// Role Delegation & Operational Kill Switches (AUTH-7, Decision D3, INV-7)
app.post('/api/v1/admin/roles/grant', requireAdmin, requireRecentAuthentication(300), grantRoleHandler);
app.get('/api/v1/admin/kill-switches', requireAdmin, getKillSwitchesHandler);
app.put('/api/v1/admin/kill-switches', requireAdmin, requireRecentAuthentication(300), updateKillSwitchesHandler);

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
