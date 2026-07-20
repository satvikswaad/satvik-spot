import { Router, Request, Response } from 'express';
import { admin, db } from '../config/firebase';
import { logger } from '../utils/logger';

export const healthRouter = Router();

/**
 * Lightweight Health Check Endpoint for Render Load Balancers
 * Does NOT require database access. Never exposes secrets or internal config.
 */
healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    version: 'v1.0.0',
    timestamp: new Date().toISOString()
  });
});

healthRouter.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    version: 'v1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * Dependency Readiness Endpoint
 * Confirms Firebase Admin SDK initialization and limited Firestore connectivity.
 * Returns 503 if backend cannot serve requests safely.
 */
healthRouter.get('/ready', async (_req: Request, res: Response) => {
  try {
    if (!admin.apps.length) {
      return res.status(503).json({
        status: 'not_ready',
        error: 'Firebase Admin SDK not initialized'
      });
    }

    // Ping Firestore to check connectivity without exposing document data
    await db.collection('_health').doc('ping').get();

    return res.status(200).json({
      status: 'ready',
      dependencies: {
        firebaseAdmin: 'connected',
        firestore: 'connected'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed', { error: 'Database connectivity unavailable' });
    return res.status(503).json({
      status: 'not_ready',
      error: 'Firestore database connectivity unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

healthRouter.get('/api/v1/ready', async (req: Request, res: Response) => {
  // Delegate to /ready logic
  const handleReady = healthRouter.stack.find(r => r.route?.path === '/ready')?.route?.stack[0]?.handle;
  if (handleReady) {
    return handleReady(req, res, () => {});
  }
  return res.status(500).end();
});
