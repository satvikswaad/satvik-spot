import { Request, Response, NextFunction } from 'express';
import { envConfig } from './environment';

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  // Determine allowed origins strictly from server configuration
  let allowedOrigins = envConfig.corsAllowedOrigins;
  if (process.env.NODE_ENV === 'production') {
    allowedOrigins = allowedOrigins.filter(o => !o.includes('localhost') && !o.includes('127.0.0.1'));
  }

  // Exact origin matching check (prevents prefix/suffix lookalike domain attacks)
  const isAllowedOrigin = origin ? allowedOrigins.includes(origin) : false;

  if (origin) {
    if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else {
      // For preflight OPTIONS from unauthorized origin, reject with 403
      if (req.method === 'OPTIONS') {
        return res.status(403).json({
          success: false,
          error: { code: 'CORS_FORBIDDEN', message: 'CORS origin not permitted by server policy' }
        });
      }
      // For non-OPTIONS requests from unauthorized origin, res has no CORS header (browser blocks reading)
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, X-Firebase-AppCheck, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    if (!origin || !isAllowedOrigin) {
      return res.status(403).json({
        success: false,
        error: { code: 'CORS_FORBIDDEN', message: 'CORS origin not permitted by server policy' }
      });
    }
    return res.status(204).end();
  }

  return next();
}
