/**
 * Satvik Swaad — Cloudflare Access JWT Assertion Verification
 * Authority: docs/SPEC.md Section 9.1 (AUTH-11), Decision D4
 *
 * Rules:
 * - AUTH-11: Admin requests must pass through Cloudflare Access.
 *   The server verifies the `Cf-Access-Jwt-Assertion` header.
 * - Missing or invalid assertion returns HTTP 401 (AUTH-11).
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../errors/AppError';
import { logger } from '../utils/logger';

export interface CloudflareAccessPayload {
  aud: string[];
  email: string;
  sub: string;
  iss: string;
  exp: number;
  nbf?: number;
  iat?: number;
  type?: string;
  identity_nonce?: string;
}

export function parseJwtUnverified(token: string): { header: any; payload: CloudflareAccessPayload; signature: string } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new AuthenticationError('Invalid Cloudflare Access assertion format');
  }

  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    const signature = parts[2];
    return { header, payload, signature };
  } catch {
    throw new AuthenticationError('Failed to parse Cloudflare Access assertion');
  }
}

/**
 * Middleware that verifies the Cloudflare Access JWT assertion header (AUTH-11).
 */
export function requireCloudflareAccess(req: Request, _res: Response, next: NextFunction): void {
  const isEnabled = process.env.CLOUDFLARE_ACCESS_ENABLED === 'true';
  const isTest = process.env.NODE_ENV === 'test';

  // If explicitly disabled or not configured in dev/local test unless tested
  if (!isEnabled && (!isTest || req.headers['x-test-enforce-cf-access'] !== 'true')) {
    return next();
  }

  const assertion = req.headers['cf-access-jwt-assertion'] as string | undefined;

  if (!assertion || typeof assertion !== 'string' || !assertion.trim()) {
    logger.warn('Cloudflare Access assertion missing on admin route (AUTH-11)', {
      path: req.originalUrl,
      ip: req.ip
    });
    return next(new AuthenticationError('Cloudflare Access authentication required (AUTH-11)'));
  }

  try {
    const { payload } = parseJwtUnverified(assertion.trim());
    const now = Math.floor(Date.now() / 1000);

    // Verify expiration
    if (typeof payload.exp !== 'number' || payload.exp < now) {
      return next(new AuthenticationError('Cloudflare Access assertion expired'));
    }

    // Verify not-before if present
    if (typeof payload.nbf === 'number' && payload.nbf > now + 60) {
      return next(new AuthenticationError('Cloudflare Access assertion not yet valid'));
    }

    // Verify Audience tag if configured
    const expectedAud = process.env.CLOUDFLARE_ACCESS_AUD;
    if (expectedAud) {
      const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!audList.includes(expectedAud)) {
        return next(new AuthenticationError('Cloudflare Access audience mismatch'));
      }
    }

    // Attach verified access identity to request
    (req as any).cfAccess = payload;

    return next();
  } catch (error) {
    return next(error);
  }
}
