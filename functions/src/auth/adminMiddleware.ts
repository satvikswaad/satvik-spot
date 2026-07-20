import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './verifyAuth';
import { AuthenticationError, AuthorizationError } from '../errors/AppError';

export const ENABLE_MFA_ENFORCEMENT = false; // Feature flag: Set true when Firebase console TOTP active

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

  if (ENABLE_MFA_ENFORCEMENT && !req.user.mfaVerified) {
    return next(new AuthorizationError('Multi-Factor Authentication (MFA) verification required'));
  }

  return next();
}

export function requireRecentAuthentication(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  // Expect client to pass fresh ID token issued recently
  return next();
}

export function requireAppCheck(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
  if (!req.isAppCheckVerified && !isEmulator) {
    return next(new AuthorizationError('App Check token verification failed'));
  }
  return next();
}
