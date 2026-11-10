/**
 * Satvik Swaad — Authoritative Security Gate & Access Control Engine
 * Authority: docs/SPEC.md Section 3.3 (ARCH-6), Section 9 (AUTH-1 to AUTH-10), Section 10
 *
 * Rules:
 * - ARCH-6: Origin gate: require X-Origin-Auth header on every request; drop direct traffic missing it.
 * - AUTH-1: Firebase Auth tokens verified with checkRevoked = true.
 * - AUTH-2: BOLA defense: Return HTTP 404 (never 403) when order does not belong to caller.
 * - AUTH-3: Guest order authentication: 32-byte token hashed with SHA-256.
 * - AUTH-4: Custom claims only for roles; ignore role field in Firestore documents.
 * - AUTH-5: Step-up re-authentication within 300 seconds.
 * - 10.3: Route rate limiters.
 */

import * as crypto from 'crypto';
import { hashGuestToken, CONFIG_LIMITS } from '../shared';

export class ResourceNotFoundError extends Error {
  public readonly statusCode = 404;
  constructor(resource = 'Order') {
    super(`${resource} not found`);
    this.name = 'ResourceNotFoundError';
  }
}

export class OriginSecurityError extends Error {
  public readonly statusCode = 403;
  constructor(message = 'Origin validation failed. Direct traffic not permitted.') {
    super(message);
    this.name = 'OriginSecurityError';
  }
}

/**
 * Route rate limits mandated by docs/SPEC.md Section 10.3
 */
export const ROUTE_RATE_LIMITS = {
  checkout: { maxRequests: 5, windowSeconds: 60 },
  login: { maxRequests: 5, windowSeconds: 60 },
  reviews: { maxRequests: 3, windowSeconds: 3600 },
  general: { maxRequests: 60, windowSeconds: 60 }
} as const;

/**
 * Constant-time string equality check to prevent timing analysis attacks.
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Origin Gate Middleware (ARCH-6)
 * Rejects any request missing or failing the X-Origin-Auth shared secret with HTTP 403.
 */
export function originGateMiddleware(expectedSecret: string) {
  return (req: any, res: any, next: (err?: any) => void) => {
    const headerVal = req.headers['x-origin-auth'];
    if (!headerVal || !timingSafeCompare(String(headerVal), expectedSecret)) {
      return res.status(403).json({
        error: 'Origin validation failed. Direct traffic is forbidden.',
        code: 'ORIGIN_FORBIDDEN'
      });
    }
    next();
  };
}

export interface CallerIdentity {
  uid?: string;
  guestToken?: string;
  isAdmin?: boolean;
}

export interface SecureOrderRecord {
  orderId: string;
  userId?: string | null;
  guestTokenHash?: string | null;
}

/**
 * Strict Broken Object Level Authorization (BOLA) Guard (AUTH-2, AUTH-3)
 * If the caller does not own the order, throws HTTP 404 (NEVER 403) so resource existence is hidden.
 */
export function assertOrderOwnership(
  order: SecureOrderRecord,
  caller: CallerIdentity
): void {
  // If caller is an authenticated admin with claims, allow access
  if (caller.isAdmin) {
    return;
  }

  // If order belongs to registered customer
  if (order.userId) {
    if (caller.uid && caller.uid === order.userId) {
      return;
    }
    // Caller is not owner -> 404 (AUTH-2)
    throw new ResourceNotFoundError('Order');
  }

  // If order belongs to a guest checkout
  if (order.guestTokenHash) {
    if (caller.guestToken) {
      const computedHash = hashGuestToken(caller.guestToken);
      if (timingSafeCompare(computedHash, order.guestTokenHash)) {
        return;
      }
    }
    // Guest token invalid or missing -> 404 (AUTH-2)
    throw new ResourceNotFoundError('Order');
  }

  // Unassigned or unverified order -> 404
  throw new ResourceNotFoundError('Order');
}

/**
 * Verifies step-up authentication freshness. (AUTH-5, STATE-6)
 * Returns true if re-authentication occurred within last 300 seconds.
 */
export function verifyStepUpAuth(
  authTimestampSeconds: number,
  nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
  if (typeof authTimestampSeconds !== 'number' || !Number.isFinite(authTimestampSeconds)) {
    return false;
  }
  const elapsed = nowSeconds - authTimestampSeconds;
  return elapsed >= 0 && elapsed <= CONFIG_LIMITS.stepUpSeconds;
}
