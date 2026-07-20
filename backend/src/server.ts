import { app } from './app';
import { envConfig, validateStartupConfig } from './config/environment';
import { logger } from './utils/logger';

// 1. Structured Startup Validation
const validation = validateStartupConfig();
if (!validation.valid) {
  logger.error('Startup validation failed due to missing or invalid required configuration', {
    errors: validation.errors
  });
  if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// 2. Start Standalone HTTP Listener on 0.0.0.0:PORT
const HOST = '0.0.0.0';
const PORT = envConfig.port;

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 Satvik Spot Backend running on http://${HOST}:${PORT}`, {
    nodeEnv: envConfig.nodeEnv,
    commerceEnabled: envConfig.commerceEnabled,
    fssaiStatus: envConfig.fssaiStatus,
    gstStatus: envConfig.gstStatus
  });
});

// 3. Graceful Shutdown Handling (SIGTERM / SIGINT)
function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal} signal. Initiating graceful shutdown...`);

  server.close((err) => {
    if (err) {
      logger.error('Error closing HTTP server during shutdown', { error: err.message });
      process.exit(1);
    }
    logger.info('HTTP server closed successfully. Shutdown complete.');
    process.exit(0);
  });

  // Force exit after 10 seconds timeout
  setTimeout(() => {
    logger.error('Forced shutdown timeout reached. Terminating process.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
