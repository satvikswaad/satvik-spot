import { Request, Response, NextFunction } from 'express';

function hardenCookieString(cookie: string): string {
  let hardened = cookie;
  if (!/;\s*Secure/i.test(hardened)) {
    hardened += '; Secure';
  }
  if (!/;\s*HttpOnly/i.test(hardened)) {
    hardened += '; HttpOnly';
  }
  if (!/;\s*SameSite\s*=/i.test(hardened)) {
    hardened += '; SameSite=Strict';
  }
  return hardened;
}

/**
 * Middleware that intercepts response Set-Cookie headers and ensures
 * Secure, HttpOnly, and SameSite=Strict directives are enforced on all outbound cookies.
 */
export function enforceSecureCookieHeaders(_req: Request, res: Response, next: NextFunction) {
  const originalSetHeader = res.setHeader.bind(res);

  res.setHeader = function (name: string, value: any) {
    if (typeof name === 'string' && name.toLowerCase() === 'set-cookie') {
      if (Array.isArray(value)) {
        value = value.map((v) => hardenCookieString(String(v)));
      } else if (typeof value === 'string') {
        value = hardenCookieString(value);
      }
    }
    return originalSetHeader(name, value);
  };

  next();
}
