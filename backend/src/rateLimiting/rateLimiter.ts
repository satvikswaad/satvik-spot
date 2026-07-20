import { Request, Response, NextFunction } from 'express';
import { db, admin } from '../config/firebase';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 10; // Max 10 requests per minute per IP

/**
 * Distributed rate limiter backed by Cloud Firestore.
 * Supports multi-instance Node.js backend execution.
 * Uses trusted proxy IP via Express req.ip.
 */
export async function rateLimiter(req: Request, _res: Response, next: NextFunction) {
  // Bypass rate limit DB network latency in local test runs
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
    return next();
  }

  // Safe IP extraction using Express trusted proxy configuration (not arbitrary forwarded headers)
  const clientIp = (req.ip || '127.0.0.1').replace(/[^a-zA-Z0-9_.-]/g, '_');
  const now = Date.now();
  const windowBucket = Math.floor(now / WINDOW_MS);

  const docId = `${clientIp}_${windowBucket}`;
  const rateLimitRef = db.collection('rate_limits').doc(docId);

  try {
    const isExceeded = await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(rateLimitRef);
      if (!snap.exists) {
        transaction.set(rateLimitRef, {
          count: 1,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: new Date(now + WINDOW_MS * 2)
        });
        return false;
      }

      const currentCount = snap.data()?.count || 0;
      if (currentCount >= MAX_REQUESTS) {
        return true;
      }

      transaction.update(rateLimitRef, { count: currentCount + 1 });
      return false;
    });

    if (isExceeded) {
      logger.warn('Distributed rate limit exceeded', { clientIp });
      return next(new AppError('Too many requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED'));
    }

    return next();
  } catch (error) {
    // Fail open in case of rate limit DB error to avoid blocking legitimate users, but log error
    logger.error('Distributed rate limiter error', { error: (error as Error).message });
    return next();
  }
}
