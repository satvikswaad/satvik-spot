import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './verifyAuth';
import { envConfig } from '../config/environment';
import { logger } from '../utils/logger';

/**
 * IP allowlist enforcement middleware for administrative endpoints.
 * Restricts access to administrative surfaces to specified IP addresses or VPN ranges.
 */
export function requireAdminIpAllowlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const allowedIps = envConfig.adminAllowedIps ||
    (process.env.ADMIN_ALLOWED_IPS ? process.env.ADMIN_ALLOWED_IPS.split(',').map(s => s.trim()).filter(Boolean) : undefined);

  // If IP allowlist is not configured or empty, permit request
  if (!allowedIps || allowedIps.length === 0) {
    return next();
  }

  // Allow explicit test bypass header for test suites when IP filtering is not under test
  if (process.env.NODE_ENV === 'test' && req.headers['x-bypass-admin-ip'] === 'true') {
    return next();
  }

  const rawIp = req.ip || req.socket.remoteAddress || '';
  const normalizedIp = rawIp.startsWith('::ffff:') ? rawIp.replace('::ffff:', '') : rawIp;

  const isAllowed = allowedIps.includes(rawIp) || allowedIps.includes(normalizedIp);

  if (!isAllowed) {
    logger.warn('Admin access rejected: Unauthorized IP', { clientIp: req.ip });
    return res.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_IP_RESTRICTED',
        message: 'Admin access restricted: Unauthorized IP'
      }
    });
  }

  return next();
}
