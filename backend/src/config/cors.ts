import { Request, Response, NextFunction } from 'express';
import { envConfig } from './environment';

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  // Determine allowed origins dynamically based on NODE_ENV
  let allowedOrigins = envConfig.corsAllowedOrigins;
  if (process.env.NODE_ENV === 'production') {
    allowedOrigins = allowedOrigins.filter(o => !o.includes('localhost') && !o.includes('127.0.0.1'));
  }

  if (origin) {
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else {
      // Reject unauthorized origin explicitly
      if (req.method === 'OPTIONS') {
        return res.status(403).json({ error: 'CORS origin not allowed' });
      }
      // For non-OPTIONS requests, do not set Access-Control-Allow-Origin
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, X-Firebase-AppCheck, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    if (!origin || !allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: 'CORS origin not allowed' });
    }
    return res.status(204).end();
  }

  return next();
}
