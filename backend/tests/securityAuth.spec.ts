import {
  originGateMiddleware,
  assertOrderOwnership,
  verifyStepUpAuth,
  ROUTE_RATE_LIMITS
} from '../src/auth/securityGateService';
import { hashGuestToken } from '../src/shared';

describe('Wave 2 — Security & Auth Module (AUTH-1..10, ARCH-6, 10.2, 10.3)', () => {
  describe('1. Origin Gate Middleware (ARCH-6)', () => {
    const validOriginSecret = 'test-origin-secret-at-least-32-bytes-long!';

    it('ARCH-6: Rejects request missing X-Origin-Auth with HTTP 403', () => {
      let status = 0;
      let body: any = null;
      const req: any = { headers: {} };
      const res: any = {
        status: (s: number) => {
          status = s;
          return {
            json: (b: any) => {
              body = b;
            }
          };
        }
      };
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      originGateMiddleware(validOriginSecret)(req, res, next);
      expect(status).toBe(403);
      expect(body?.error).toMatch(/origin validation failed/i);
      expect(nextCalled).toBe(false);
    });

    it('ARCH-6: Rejects request with invalid X-Origin-Auth with HTTP 403', () => {
      let status = 0;
      const req: any = { headers: { 'x-origin-auth': 'invalid-tampered-secret-value-here' } };
      const res: any = {
        status: (s: number) => {
          status = s;
          return { json: () => {} };
        }
      };
      let nextCalled = false;

      originGateMiddleware(validOriginSecret)(req, res, () => {
        nextCalled = true;
      });
      expect(status).toBe(403);
      expect(nextCalled).toBe(false);
    });

    it('ARCH-6: Allows request with matching X-Origin-Auth header', () => {
      const req: any = { headers: { 'x-origin-auth': validOriginSecret } };
      const res: any = {};
      let nextCalled = false;

      originGateMiddleware(validOriginSecret)(req, res, () => {
        nextCalled = true;
      });
      expect(nextCalled).toBe(true);
    });
  });

  describe('2. BOLA Defense & Order Ownership (AUTH-2, AUTH-3)', () => {
    const userOrder = {
      orderId: 'SS-7B9X4K2M8P1Q',
      userId: 'user_savitri_123',
      guestTokenHash: null
    };

    const guestOrder = {
      orderId: 'SS-3J7K9M2P4Q8R',
      userId: null,
      guestTokenHash: hashGuestToken('sample-valid-guest-token-32bytes')
    };

    it('AUTH-2: Allows access when authenticated userId matches order', () => {
      expect(() => {
        assertOrderOwnership(userOrder, { uid: 'user_savitri_123' });
      }).not.toThrow();
    });

    it('AUTH-2: Rejects mismatched userId with HTTP 404 (NEVER 403)', () => {
      try {
        assertOrderOwnership(userOrder, { uid: 'attacker_user_999' });
        fail('Expected 404 error');
      } catch (err: any) {
        expect(err.statusCode).toBe(404);
        expect(err.message).toMatch(/not found/i);
      }
    });

    it('AUTH-3: Allows access when valid guest token matches SHA-256 hash', () => {
      expect(() => {
        assertOrderOwnership(guestOrder, { guestToken: 'sample-valid-guest-token-32bytes' });
      }).not.toThrow();
    });

    it('AUTH-3: Rejects invalid guest token with HTTP 404 (NEVER 403)', () => {
      try {
        assertOrderOwnership(guestOrder, { guestToken: 'wrong-token' });
        fail('Expected 404 error');
      } catch (err: any) {
        expect(err.statusCode).toBe(404);
        expect(err.message).toMatch(/not found/i);
      }
    });
  });

  describe('3. Step-Up Authentication Window (AUTH-5, STATE-6)', () => {
    it('AUTH-5: Accepts auth timestamp within 300 seconds', () => {
      const now = Math.floor(Date.now() / 1000);
      const authTime = now - 150; // 150s ago
      expect(verifyStepUpAuth(authTime, now)).toBe(true);
    });

    it('AUTH-5: Rejects auth timestamp older than 300 seconds', () => {
      const now = Math.floor(Date.now() / 1000);
      const authTime = now - 301; // 301s ago
      expect(verifyStepUpAuth(authTime, now)).toBe(false);
    });
  });

  describe('4. Rate Limit Windows (Section 10.3)', () => {
    it('Reflects strict specification limits per route', () => {
      expect(ROUTE_RATE_LIMITS.checkout.maxRequests).toBe(5);
      expect(ROUTE_RATE_LIMITS.checkout.windowSeconds).toBe(60);

      expect(ROUTE_RATE_LIMITS.login.maxRequests).toBe(5);
      expect(ROUTE_RATE_LIMITS.login.windowSeconds).toBe(60);

      expect(ROUTE_RATE_LIMITS.reviews.maxRequests).toBe(3);
      expect(ROUTE_RATE_LIMITS.reviews.windowSeconds).toBe(3600);

      expect(ROUTE_RATE_LIMITS.general.maxRequests).toBe(60);
      expect(ROUTE_RATE_LIMITS.general.windowSeconds).toBe(60);
    });
  });
});
