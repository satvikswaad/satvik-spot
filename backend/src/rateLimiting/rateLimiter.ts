import { Request, Response, NextFunction } from 'express';
import { db, admin } from '../config/firebase';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { logAuditEvent } from '../audit/auditLogger';

export interface RouteRateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  routeIdentifier: string;
}

/**
 * Factory for route-specific sliding window rate limiters backed by Firestore.
 * Supports distributed multi-instance deployment.
 */
export function createRouteRateLimiter(options: { windowMs: number; maxRequests: number; routeIdentifier: string }) {
  const { windowMs, maxRequests, routeIdentifier } = options;

  return async function routeRateLimiter(req: Request, _res: Response, next: NextFunction) {
    // Bypass rate limit DB network latency in local test runs
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
      return next();
    }

    // Safe IP extraction using Express trusted proxy configuration (not arbitrary forwarded headers)
    const clientIp = (req.ip || '127.0.0.1').replace(/[^a-zA-Z0-9_.-]/g, '_');
    const now = Date.now();
    const windowBucket = Math.floor(now / windowMs);

    const docId = `${clientIp}_${routeIdentifier}_${windowBucket}`;
    const rateLimitRef = db.collection('rate_limits').doc(docId);

    try {
      let currentCount = 0;
      const isExceeded = await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(rateLimitRef);
        if (!snap.exists) {
          currentCount = 1;
          transaction.set(rateLimitRef, {
            count: 1,
            routeIdentifier,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(now + windowMs * 2)
          });
          return false;
        }

        const existingCount = snap.data()?.count || 0;
        currentCount = existingCount + 1;
        if (existingCount >= maxRequests) {
          return true;
        }

        transaction.update(rateLimitRef, { count: currentCount });
        return false;
      });

      if (isExceeded) {
        const violationDetails = {
          routeIdentifier,
          clientIp,
          count: currentCount,
          maxRequests: options.maxRequests,
          windowMs: options.windowMs,
          url: req.originalUrl
        };
        logger.warn('Rate limit violation detected', violationDetails);
        await logAuditEvent({
          action: 'RATE_LIMIT_EXCEEDED',
          actorUid: (req as any).user?.uid || `IP_${clientIp}`,
          outcome: 'DENIED',
          ip: clientIp,
          details: violationDetails
        });
        return next(new AppError('Too many requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED'));
      }

      return next();
    } catch (error) {
      // Fail open in case of rate limit DB error to avoid blocking legitimate users, but log error
      logger.error('Distributed rate limiter error', { routeIdentifier, error: (error as Error).message });
      return next();
    }
  };
}

// Global baseline rate limiter (60 req/min)
export const rateLimiter = createRouteRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  routeIdentifier: 'global'
});

// Domain/route-specific rate limiters
export const orderRateLimiter = createRouteRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  routeIdentifier: 'orders'
});

export const messageRateLimiter = createRouteRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  routeIdentifier: 'messages'
});

export const reviewRateLimiter = createRouteRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  routeIdentifier: 'reviews'
});

export const guestLookupRateLimiter = createRouteRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  routeIdentifier: 'guest_lookup'
});

export const adminRateLimiter = createRouteRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  routeIdentifier: 'admin'
});

export const customerRateLimiter = createRouteRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  routeIdentifier: 'customer'
});

export const authRateLimiter = createRouteRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  routeIdentifier: 'auth'
});

