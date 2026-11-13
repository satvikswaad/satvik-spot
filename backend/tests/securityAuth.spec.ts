import crypto from 'crypto';
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/config/firebase';
import { envConfig, validateStartupConfig } from '../src/config/environment';
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

    it('ARCH-6: Express App drops requests to /api missing X-Origin-Auth when ORIGIN_GATE_ENABLED=true', async () => {
      process.env.ORIGIN_GATE_ENABLED = 'true';
      try {
        const res = await request(app).get('/api/v1/customer/profile');
        expect(res.status).toBe(403);
        expect(res.body.code).toBe('ORIGIN_FORBIDDEN');
      } finally {
        delete process.env.ORIGIN_GATE_ENABLED;
      }
    });

    it('ARCH-6: Express App allows requests to /api with valid X-Origin-Auth header', async () => {
      process.env.ORIGIN_GATE_ENABLED = 'true';
      const secret = process.env.ORIGIN_AUTH_SECRET || 'dev-fallback-origin-secret-32-bytes!';
      const spy = jest.spyOn(db, 'collection').mockReturnValue({
        doc: () => ({ get: async () => ({ exists: false }) })
      } as any);
      try {
        const res = await request(app)
          .post('/api/v1/orders/guest-lookup')
          .set('x-origin-auth', secret)
          .send({ orderId: 'SS-NONEXISTENT', guestAccessSecret: 'dummy-secret' });
        expect(res.status).toBe(404);
        expect(res.status).not.toBe(403);
      } finally {
        spy.mockRestore();
        delete process.env.ORIGIN_GATE_ENABLED;
      }
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

    it('AUTH-3: Express App POST /api/v1/orders/guest-lookup rejects invalid secret with HTTP 404 (NEVER 403)', async () => {
      const orderId = 'SS-TEST-GUEST-01';
      const rawSecret = 'correct-guest-secret-12345';
      const hashedSecret = crypto.createHash('sha256').update(rawSecret).digest('hex');

      const spy = jest.spyOn(db, 'collection').mockImplementation((coll: string) => {
        if (coll === 'orders') {
          return {
            doc: (docId: string) => ({
              get: async () => ({
                exists: docId === orderId,
                data: () => docId === orderId ? {
                  orderId,
                  guestSecretHash: hashedSecret,
                  orderStatus: 'PLACED',
                  totalPaise: 49900
                } : null
              })
            })
          } as any;
        }
        return { doc: () => ({ get: async () => ({ exists: false }) }) } as any;
      });

      try {
        // Valid secret succeeds with 200
        const validRes = await request(app)
          .post('/api/v1/orders/guest-lookup')
          .send({ orderId, guestAccessSecret: rawSecret });
        expect(validRes.status).toBe(200);
        expect(validRes.body.data.orderId).toBe(orderId);
        expect(validRes.body.data.guestSecretHash).toBeUndefined();

        // Invalid secret returns 404
        const invalidRes = await request(app)
          .post('/api/v1/orders/guest-lookup')
          .send({ orderId, guestAccessSecret: 'wrong-secret-value-abc' });
        expect(invalidRes.status).toBe(404);

        // Unknown orderId returns 404
        const notFoundRes = await request(app)
          .post('/api/v1/orders/guest-lookup')
          .send({ orderId: 'SS-NON-EXISTENT', guestAccessSecret: rawSecret });
        expect(notFoundRes.status).toBe(404);
      } finally {
        spy.mockRestore();
      }
    });

    it('AUTH-3: Express App POST /api/v1/orders/submit-utr rejects invalid secret on guest order with HTTP 404', async () => {
      const orderId = 'SS-TEST-GUEST-UTR';
      const rawSecret = 'correct-utr-secret-67890';
      const hashedSecret = crypto.createHash('sha256').update(rawSecret).digest('hex');

      const collSpy = jest.spyOn(db, 'collection').mockImplementation(((coll: string) => ({
        doc: (docId?: string) => ({
          id: docId || orderId,
          get: async () => ({ exists: false }),
          set: async () => ({})
        }),
        where: () => ({
          limit: () => ({
            get: async () => ({ empty: true, docs: [] })
          })
        })
      })) as any);

      const txSpy = jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
        return cb({
          get: async () => ({
            exists: true,
            data: () => ({
              orderId,
              guestSecretHash: hashedSecret,
              orderStatus: 'PLACED',
              paymentStatus: 'UNPAID',
              totalPaise: 49900
            })
          }),
          update: jest.fn()
        });
      });

      try {
        // Submit UTR with wrong guest secret -> 404
        const invalidRes = await request(app)
          .post('/api/v1/orders/submit-utr')
          .send({
            orderId,
            utr: 'UTR98765432101',
            guestAccessSecret: 'wrong-utr-secret'
          });
        expect(invalidRes.status).toBe(404);
      } finally {
        txSpy.mockRestore();
        collSpy.mockRestore();
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

  describe('5. Startup Configuration Validation (PAY-11, AGENT-7)', () => {
    it('PAY-11: Rejects Razorpay test key in production', () => {
      const res = validateStartupConfig({
        nodeEnv: 'production',
        razorpayKeyId: 'rzp_test_invalid_in_prod'
      });
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('rzp_test_'))).toBe(true);
    });

    it('PAY-11: Rejects PayU TEST environment in production', () => {
      const res = validateStartupConfig({
        nodeEnv: 'production',
        payuEnv: 'TEST'
      });
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('PayU TEST'))).toBe(true);
    });

    it('PAY-11: Rejects Razorpay live key in non-production (staging/dev)', () => {
      const res = validateStartupConfig({
        nodeEnv: 'staging',
        razorpayKeyId: 'rzp_live_forbidden_in_dev'
      });
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('rzp_live_'))).toBe(true);
    });

    it('PAY-11: Accepts valid non-production configuration with test keys', () => {
      const res = validateStartupConfig({
        nodeEnv: 'staging',
        razorpayKeyId: 'rzp_test_valid_staging_key',
        payuEnv: 'TEST'
      });
      expect(res.errors.filter(e => e.includes('Razorpay') || e.includes('PayU'))).toHaveLength(0);
    });
  });
});
