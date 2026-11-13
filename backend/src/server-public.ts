/**
 * Satvik Swaad — Public Storefront Server Entry Point
 * Authority: Decision D1, Ticket T-020
 *
 * Dedicated listener for customer-facing storefront traffic:
 * - Public catalog, cart, quotes, checkout, payment webhooks, reviews, messages.
 * - Admin routes are disabled/inaccessible on this public origin.
 */

import express from 'express';
import { app } from './app';
import { envConfig, validateStartupConfig } from './config/environment';
import { logger } from './utils/logger';

// Set service role
process.env.SERVICE_ROLE = 'public';

// 1. Structured Startup Validation
const validation = validateStartupConfig();
if (!validation.valid) {
  logger.error('Startup validation failed for Public Storefront server', {
    errors: validation.errors
  });
  if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// 2. Start Standalone HTTP Listener on 0.0.0.0:PORT
const HOST = '0.0.0.0';
const PORT = parseInt(process.env.PORT_PUBLIC || process.env.PORT || '5000', 10);

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 Satvik Spot Public Storefront running on http://${HOST}:${PORT}`, {
    serviceRole: 'public',
    nodeEnv: envConfig.nodeEnv,
    commerceEnabled: envConfig.commerceEnabled
  });
});

// 3. Graceful Shutdown Handling (SIGTERM / SIGINT)
function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal} signal. Shutting down Public Storefront server...`);

  server.close((err) => {
    if (err) {
      logger.error('Error closing HTTP server during shutdown', { error: err.message });
      process.exit(1);
    }
    logger.info('Public Storefront HTTP server closed successfully.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown timeout reached. Terminating process.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
