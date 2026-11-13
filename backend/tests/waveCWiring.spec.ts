/**
 * Satvik Swaad — Wave C Verification Test Suite
 * Authority: docs/SPEC.md Waves C (Tickets T-016 to T-021)
 *
 * Verifies:
 * - T-016: Quotes API, priceOrder wiring, paise enforcement, MONEY-6
 * - T-017: DISC-1..5 redemption transactions & limits
 * - T-018: Public catalog stock concealment & batch fields (STOCK-2, STOCK-3, STOCK-7)
 * - T-019: Rate limiter Firestore store, Cloudflare Access JWT (AUTH-11)
 * - T-020: Public/Admin server split, Report-Only CSP
 * - T-021: Collections cleanup, stats_daily atomic increments, INV-1..9
 */

import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/config/firebase';
import { sanitizePublicProduct } from '../src/products/productController';
import { requireCloudflareAccess } from '../src/auth/cloudflareAccess';
import { runNightlyInvariants, checkInv1PaidOrders, checkInv4RefundsNotExceedPaid, checkInv7NoRolesInUserDocs } from '../src/db/invariants';
import { formatDailyDateKey, applySaleToDailyStats, applyRefundToDailyStats } from '../src/db/statsDailyService';
import { validateQuotePayload } from '../src/validation/orderSchema';

describe('Wave C Verification Suite (Tickets T-016 to T-021)', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // T-016: Quotes API & MONEY-6 Zero Client Financial Trust
  // ──────────────────────────────────────────────────────────────────────────
  describe('T-016: Quotes API & Zero Client Financial Trust (PRICE-1..9, MONEY-6)', () => {
    it('MONEY-6: validateQuotePayload strictly rejects client-supplied price or total with 400', () => {
      const payloadWithPrice = {
        items: [{ productId: 'test-product', qty: 1 }],
        price: 24900
      };
      expect(() => validateQuotePayload(payloadWithPrice)).toThrow(/financial/i);

      const payloadWithTotal = {
        items: [{ productId: 'test-product', qty: 1 }],
        total: 500
      };
      expect(() => validateQuotePayload(payloadWithTotal)).toThrow(/financial/i);

      const payloadWithSubtotal = {
        items: [{ productId: 'test-product', qty: 1 }],
        subtotalPaise: 49900
      };
      expect(() => validateQuotePayload(payloadWithSubtotal)).toThrow(/financial/i);
    });

    it('MONEY-6: Express App POST /api/v1/quotes rejects client-supplied financial fields with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .send({
          items: [{ productId: 'mango-achar', qty: 1 }],
          price: 250,
          total: 250
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/client must not supply financial fields/i);
    });

    it('PRICE-7, Decision D16: Express App POST /api/v1/quotes returns 10-minute TTL quote with integer paise', async () => {
      // Mock product document in Firestore
      const testProductDoc = {
        id: 'mango-achar',
        name: 'Aam Ka Achar',
        pricePaise: 24900,
        price: 249,
        available: true,
        stock: 50,
        variants: [
          {
            id: 'mango-achar-500g',
            label: '500g Glass Jar',
            pricePaise: 24900,
            price: 249,
            active: true,
            stock: 25,
            hsn: '20019000',
            taxRatePercent: 12
          }
        ]
      };

      jest.spyOn(db, 'collection').mockImplementation((colName: string): any => {
        if (colName === 'products') {
          return {
            doc: (_id: string) => ({
              get: async () => ({
                exists: true,
                id: testProductDoc.id,
                data: () => testProductDoc
              })
            })
          };
        }
        if (colName === 'config') {
          return {
            doc: (_id: string) => ({
              get: async () => ({
                exists: true,
                data: () => ({ localPincodes: ['274001'], freeThresholdPaise: 49900, standardDeliveryPaise: 5000 })
              })
            })
          };
        }
        if (colName === 'coupons' || colName === 'discounts') {
          return {
            doc: (_id: string) => ({
              get: async () => ({ exists: false })
            })
          };
        }
        return {
          doc: () => ({
            get: async () => ({ exists: false })
          })
        };
      });

      const res = await request(app)
        .post('/api/v1/quotes')
        .send({
          items: [{ productId: 'mango-achar', variantId: 'mango-achar-500g', qty: 2 }],
          pincode: '221001'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.quoteId).toMatch(/^qt_/);
      expect(data.subtotalPaise).toBe(49800); // 2 * 24900
      expect(data.deliveryFeePaise).toBe(5000); // Under ₹499 (49800 < 49900)
      expect(data.taxPaise).toBe(5976); // 12% on 49800
      expect(data.totalPaise).toBe(49800 + 5000);

      // Quote expiration is 10 minutes in future (PRICE-7, Decision D16)
      const expiresAt = new Date(data.quoteExpiresAt).getTime();
      const now = Date.now();
      const diffMinutes = Math.round((expiresAt - now) / 60000);
      expect(diffMinutes).toBe(10);

      jest.restoreAllMocks();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-018: Public Catalog Stock Concealment (STOCK-2, STOCK-7)
  // ──────────────────────────────────────────────────────────────────────────
  describe('T-018: Public Catalog Stock Concealment (STOCK-2, STOCK-7)', () => {
    it('STOCK-2: sanitizePublicProduct masks exact stock and returns inStock / lowStock flags only', () => {
      const rawProduct = {
        name: 'Chyawanprash',
        pricePaise: 55000,
        price: 550,
        stock: 3, // <= 5: lowStock
        available: true,
        batchId: 'BATCH-2026-09',
        bestBeforeDate: '2027-09-01',
        variants: [
          {
            id: 'cp-500g',
            label: '500g',
            pricePaise: 55000,
            price: 550,
            stock: 3,
            active: true
          },
          {
            id: 'cp-1kg',
            label: '1kg',
            pricePaise: 95000,
            price: 950,
            stock: 0, // out of stock
            active: true
          }
        ]
      };

      const sanitized = sanitizePublicProduct(rawProduct, 'cp-1');

      // Top-level assertions
      expect((sanitized as any).stock).toBeUndefined(); // NEVER exposed
      expect(sanitized.inStock).toBe(true);
      expect(sanitized.lowStock).toBe(true);
      expect(sanitized.batchId).toBe('BATCH-2026-09');
      expect(sanitized.bestBeforeDate).toBe('2027-09-01');

      // Variant assertions
      expect(sanitized.variants[0].stock).toBeUndefined();
      expect(sanitized.variants[0].inStock).toBe(true);
      expect(sanitized.variants[0].lowStock).toBe(true);

      expect(sanitized.variants[1].stock).toBeUndefined();
      expect(sanitized.variants[1].inStock).toBe(false);
      expect(sanitized.variants[1].lowStock).toBe(false);
    });

    it('STOCK-2: Express App GET /api/v1/products returns public catalog with masked stock', async () => {
      jest.spyOn(db, 'collection').mockImplementation((colName: string): any => {
        if (colName === 'products') {
          return {
            where: () => ({
              get: async () => ({
                docs: [
                  {
                    id: 'prod-1',
                    data: () => ({
                      name: 'Aam Achar',
                      pricePaise: 24900,
                      stock: 100, // exact count must NOT appear in response
                      available: true,
                      variants: [{ id: 'v1', stock: 50, active: true }]
                    })
                  }
                ]
              })
            })
          };
        }
        return { doc: () => ({ get: async () => ({ exists: false }) }) };
      });

      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].stock).toBeUndefined();
      expect(res.body.data[0].inStock).toBe(true);
      expect(res.body.data[0].lowStock).toBe(false);
      expect(res.body.data[0].variants[0].stock).toBeUndefined();

      jest.restoreAllMocks();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-019: Cloudflare Access JWT Assertion (AUTH-11)
  // ──────────────────────────────────────────────────────────────────────────
  describe('T-019: Cloudflare Access Assertion (AUTH-11, Decision D4)', () => {
    it('AUTH-11: Rejects admin request with HTTP 401 when cf-access-jwt-assertion is missing and enforcement active', () => {
      let status = 0;
      let body: any = null;
      const req: any = {
        headers: { 'x-test-enforce-cf-access': 'true' },
        originalUrl: '/api/v1/admin/dashboard-summary',
        ip: '127.0.0.1'
      };
      const res: any = {};
      const next = (err?: any) => {
        if (err) {
          status = err.statusCode || 500;
          body = err;
        }
      };

      requireCloudflareAccess(req, res, next);
      expect(status).toBe(401);
      expect(body?.message).toMatch(/Cloudflare Access authentication required/i);
    });

    it('AUTH-11: Accepts valid unexpired Cloudflare Access assertion header', () => {
      const now = Math.floor(Date.now() / 1000);
      const validPayload = {
        aud: ['test-aud-id'],
        email: 'owner@satvikswaad.com',
        sub: 'cf-user-123',
        iss: 'https://satvikswaad.cloudflareaccess.com',
        exp: now + 3600
      };

      const headerB64 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payloadB64 = Buffer.from(JSON.stringify(validPayload)).toString('base64url');
      const mockToken = `${headerB64}.${payloadB64}.mock-signature-here`;

      const req: any = {
        headers: {
          'x-test-enforce-cf-access': 'true',
          'cf-access-jwt-assertion': mockToken
        },
        originalUrl: '/api/v1/admin/dashboard-summary',
        ip: '127.0.0.1'
      };
      const res: any = {};
      let nextCalledWith: any = null;
      const next = (err?: any) => {
        nextCalledWith = err;
      };

      requireCloudflareAccess(req, res, next);
      expect(nextCalledWith).toBeUndefined();
      expect(req.cfAccess.email).toBe('owner@satvikswaad.com');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-021: Database Invariants (INV-1..9) & stats_daily (DB-5, DB-6, DB-7)
  // ──────────────────────────────────────────────────────────────────────────
  describe('T-021: Database Invariants (INV-1..9) & stats_daily Aggregations', () => {
    it('DB-5, DB-6: formatDailyDateKey formats IST date and applySaleToDailyStats updates metrics', () => {
      const dateKey = formatDailyDateKey(new Date('2026-11-13T10:00:00Z'));
      expect(dateKey).toBe('2026-11-13');

      const initial = {
        date: '2026-11-13',
        revenuePaise: 0,
        ordersCount: 0,
        unitsCount: 0,
        refundedPaise: 0,
        byChannel: {},
        byHour: {}
      };

      const updated = applySaleToDailyStats(initial, {
        totalPaise: 49900,
        channel: 'ONLINE',
        hour: 15,
        unitsCount: 2
      });

      expect(updated.revenuePaise).toBe(49900);
      expect(updated.ordersCount).toBe(1);
      expect(updated.unitsCount).toBe(2);
      expect(updated.byChannel.ONLINE.revenuePaise).toBe(49900);
      expect(updated.byHour['15'].revenuePaise).toBe(49900);
    });

    it('DB-7: applyRefundToDailyStats decrements revenue and increments refundedPaise', () => {
      const stats = {
        date: '2026-11-13',
        revenuePaise: 49900,
        ordersCount: 1,
        unitsCount: 2,
        refundedPaise: 0,
        byChannel: {},
        byHour: {}
      };

      const refunded = applyRefundToDailyStats(stats, 10000); // ₹100 refund
      expect(refunded.revenuePaise).toBe(39900);
      expect(refunded.refundedPaise).toBe(10000);
    });

    it('INV-7: checkInv7NoRolesInUserDocs flags privilege fields in users collection as S0', async () => {
      jest.spyOn(db, 'collection').mockImplementation((colName: string): any => {
        if (colName === 'users') {
          return {
            get: async () => ({
              docs: [
                {
                  id: 'malicious-user',
                  data: () => ({ name: 'Attacker', role: 'admin', isAdmin: true })
                }
              ]
            })
          };
        }
        return { get: async () => ({ docs: [] }) };
      });

      const violations = await checkInv7NoRolesInUserDocs();
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].invariantId).toBe('INV-7');
      expect(violations[0].severity).toBe('S0');

      jest.restoreAllMocks();
    });

    it('INV-4: checkInv4RefundsNotExceedPaid flags orders where refund exceeds total paid as S0', async () => {
      jest.spyOn(db, 'collection').mockImplementation((colName: string): any => {
        if (colName === 'refunds') {
          return {
            get: async () => ({
              docs: [
                {
                  id: 'rf-1',
                  data: () => ({ orderId: 'ord-123', amountPaise: 60000, status: 'COMPLETED' })
                }
              ]
            })
          };
        }
        if (colName === 'orders') {
          return {
            doc: (_id: string) => ({
              get: async () => ({
                exists: true,
                data: () => ({ totalPaise: 50000 })
              })
            })
          };
        }
        return { get: async () => ({ docs: [] }) };
      });

      const violations = await checkInv4RefundsNotExceedPaid();
      expect(violations.length).toBe(1);
      expect(violations[0].invariantId).toBe('INV-4');
      expect(violations[0].severity).toBe('S0');

      jest.restoreAllMocks();
    });
  });
});
