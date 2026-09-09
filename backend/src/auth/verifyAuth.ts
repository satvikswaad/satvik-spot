import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { logger } from '../utils/logger';
import { AppError } from '../errors/AppError';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    isAdmin: boolean;
    role: string;
    authTime: number;
    mfaVerified: boolean;
    roles: string[];
    firebase?: {
      sign_in_second_factor?: string;
      [key: string]: any;
    };
  };
  isAppCheckVerified?: boolean;
}

export async function verifyAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.FIRESTORE_EMULATOR_HOST !== undefined || (process.env.NODE_ENV === 'test' && process.env.FUNCTIONS_EMULATOR !== 'false');
  const appCheckToken = req.headers['x-firebase-appcheck'] as string | undefined;

  if (appCheckToken) {
    req.isAppCheckVerified = true;
  } else {
    req.isAppCheckVerified = false;
    if (!isEmulator) {
      logger.warn('Production request rejected: Missing App Check token');
      return next(new AppError('App Check token verification failed', 403, 'APP_CHECK_FAILED'));
    } else {
      logger.warn('Emulator mode: App Check token missing, allowing fallback for local testing');
    }
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = undefined;
    return next();
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    req.user = undefined;
    return next();
  }

  // Local test/emulator token fallback (Only active during automated test / emulator runs)
  if (isEmulator && token.startsWith('mock_')) {
    const nowSec = Math.floor(Date.now() / 1000);
    if (token === 'mock_admin_token' || token === 'mock_valid_token' || token === 'mock_owner_token') {
      req.user = {
        uid: 'admin_test_uid',
        email: 'admin@satvikspot.com',
        isAdmin: true,
        role: 'admin_owner',
        authTime: nowSec,
        mfaVerified: true,
        roles: ['admin_owner', 'admin']
      };
      return next();
    }
    if (token === 'mock_stale_auth_token') {
      req.user = {
        uid: 'admin_test_uid',
        email: 'admin@satvikspot.com',
        isAdmin: true,
        role: 'admin_owner',
        authTime: nowSec - 3600, // 1 hour ago
        mfaVerified: true,
        roles: ['admin_owner', 'admin']
      };
      return next();
    }
    if (token === 'mock_catalog_manager_token') {
      req.user = {
        uid: 'cat_mgr_uid',
        email: 'catmgr@satvikspot.com',
        isAdmin: true,
        role: 'catalog_manager',
        authTime: nowSec,
        mfaVerified: true,
        roles: ['catalog_manager']
      };
      return next();
    }
    if (token === 'mock_order_manager_token') {
      req.user = {
        uid: 'order_mgr_uid',
        email: 'ordermgr@satvikspot.com',
        isAdmin: true,
        role: 'order_manager',
        authTime: nowSec,
        mfaVerified: true,
        roles: ['order_manager']
      };
      return next();
    }
    if (token === 'mock_financial_auditor_token') {
      req.user = {
        uid: 'fin_auditor_uid',
        email: 'finauditor@satvikspot.com',
        isAdmin: true,
        role: 'financial_auditor',
        authTime: nowSec,
        mfaVerified: true,
        roles: ['financial_auditor']
      };
      return next();
    }
    if (token === 'mock_support_agent_token') {
      req.user = {
        uid: 'support_agent_uid',
        email: 'support@satvikspot.com',
        isAdmin: true,
        role: 'support_agent',
        authTime: nowSec,
        mfaVerified: true,
        roles: ['support_agent']
      };
      return next();
    }
    if (token === 'mock_admin_no_mfa_token') {
      req.user = {
        uid: 'admin_no_mfa_uid',
        email: 'admin_nomfa@satvikspot.com',
        isAdmin: true,
        role: 'admin_owner',
        authTime: nowSec,
        mfaVerified: false,
        roles: ['admin_owner', 'admin']
      };
      return next();
    }
    if (token === 'mock_cust_token') {
      req.user = {
        uid: 'cust_test_uid',
        email: 'customer@satvikspot.com',
        isAdmin: false,
        role: 'customer',
        authTime: nowSec,
        mfaVerified: false,
        roles: []
      };
      return next();
    }
    if (token === 'mock_cust_token_2') {
      req.user = {
        uid: 'cust_test_uid_2',
        email: 'customer2@satvikspot.com',
        isAdmin: false,
        role: 'customer',
        authTime: nowSec,
        mfaVerified: false,
        roles: []
      };
      return next();
    }
    if (token === 'mock_revoked_token' || token === 'mock_invalid_token') {
      req.user = undefined;
      return next();
    }
  }

  try {
    const decoded = await auth.verifyIdToken(token, true); // true = check Revoked sessions
    const isAdminClaim = decoded.admin === true;
    const assignedRole = (decoded.role as string) || (isAdminClaim ? 'admin_owner' : 'customer');
    const assignedRoles = Array.isArray(decoded.roles) ? decoded.roles : (isAdminClaim ? ['admin_owner', 'admin'] : []);

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      isAdmin: isAdminClaim,
      role: assignedRole,
      authTime: decoded.auth_time || Math.floor(Date.now() / 1000),
      mfaVerified: (decoded.firebase?.sign_in_second_factor === 'totp') || ((decoded as any).mfaVerified === true),
      roles: assignedRoles,
      firebase: decoded.firebase
    };
    return next();
  } catch (error) {
    logger.warn('Failed to verify bearer ID token', { error: (error as Error).message });
    req.user = undefined;
    return next();
  }
}
