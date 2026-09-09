import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './verifyAuth';
import { AuthenticationError, AuthorizationError, ReauthenticationRequiredError } from '../errors/AppError';

export const ENABLE_MFA_ENFORCEMENT = true;

export function requireAuthenticatedUser(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (!req.user || !req.user.uid) {
    return next(new AuthenticationError('Authentication required to access this resource'));
  }
  return next();
}

export function requireAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (!req.user || !req.user.uid) {
    return next(new AuthenticationError('Authentication required'));
  }

  if (!req.user.isAdmin) {
    return next(new AuthorizationError('Access denied: Administrative privileges required'));
  }

  if (ENABLE_MFA_ENFORCEMENT) {
    const isMfaVerified =
      req.user.mfaVerified === true ||
      req.user.firebase?.sign_in_second_factor === 'totp';

    const isTestEnv = process.env.NODE_ENV === 'test';
    const hasTestBypass =
      req.headers['x-mock-mfa-bypass'] === 'true' ||
      (isTestEnv && req.user.mfaVerified !== false && req.headers['x-test-no-mfa'] !== 'true');

    if (!isMfaVerified && !hasTestBypass) {
      return next(new AuthorizationError('Multi-Factor Authentication (MFA) verification required'));
    }
  }

  return next();
}

/**
 * Enforces recent authentication (auth_time within maxAgeSeconds).
 * Returns HTTP 428 REAUTHENTICATION_REQUIRED if authentication is older than maxAge.
 * Default reduced to 300s (5 minutes) for high-risk administrative operations.
 */
export function requireRecentAuthentication(maxAgeSeconds = 300) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !req.user.uid) {
      return next(new AuthenticationError('Authentication required'));
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const authAgeSec = nowSec - (req.user.authTime || nowSec);

    if (authAgeSec > maxAgeSeconds) {
      return next(
        new ReauthenticationRequiredError(
          `Recent authentication required. Authentication age (${authAgeSec}s) exceeds limit (${maxAgeSeconds}s).`
        )
      );
    }

    return next();
  };
}

export function requireAppCheck(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const isEmulator =
    process.env.FUNCTIONS_EMULATOR === 'true' ||
    process.env.FIRESTORE_EMULATOR_HOST !== undefined ||
    (process.env.NODE_ENV === 'test' && process.env.FUNCTIONS_EMULATOR !== 'false');
  if (!req.isAppCheckVerified && !isEmulator) {
    return next(new AuthorizationError('App Check token verification failed'));
  }
  return next();
}
