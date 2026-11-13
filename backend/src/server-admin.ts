/**
 * Satvik Swaad — Admin ERP & POS Server Entry Point
 * Authority: Decision D1, Decision D4 (AUTH-11), Ticket T-020
 *
 * Dedicated listener for staff, manager, owner ERP and POS traffic:
 * - Admin order management, state transitions, refunds, inventory, audit logs.
 * - Cloudflare Access JWT assertion (`Cf-Access-Jwt-Assertion`) verification enforced.
 */

import { app } from './app';
import { envConfig, validateStartupConfig } from './config/environment';
import { logger } from './utils/logger';

// Set service role and enforce Cloudflare Access
process.env.SERVICE_ROLE = 'admin';
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  process.env.CLOUDFLARE_ACCESS_ENABLED = 'true';
}

// 1. Structured Startup Validation
const validation = validateStartupConfig();
if (!validation.valid) {
  logger.error('Startup validation failed for Admin ERP/POS server', {
    errors: validation.errors
  });
  if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// 2. Start Standalone HTTP Listener on 0.0.0.0:PORT
const HOST = '0.0.0.0';
const PORT = parseInt(process.env.PORT_ADMIN || process.env.PORT || '5001', 10);

const server = app.listen(PORT, HOST, () => {
  logger.info(`🔒 Satvik Spot Admin ERP/POS Server running on http://${HOST}:${PORT}`, {
    serviceRole: 'admin',
    nodeEnv: envConfig.nodeEnv,
    cloudflareAccessEnabled: process.env.CLOUDFLARE_ACCESS_ENABLED === 'true'
  });
});

// 3. Graceful Shutdown Handling (SIGTERM / SIGINT)
function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal} signal. Shutting down Admin ERP/POS server...`);

  server.close((err) => {
    if (err) {
      logger.error('Error closing Admin HTTP server during shutdown', { error: err.message });
      process.exit(1);
    }
    logger.info('Admin ERP/POS HTTP server closed successfully.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown timeout reached. Terminating process.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
