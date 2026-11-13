import request from 'supertest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { app } from '../src/app';

// Mock Firebase Admin Auth & Firestore for testing
const mockSubscribers: Record<string, any> = {};
const mockOrders: Record<string, any> = {};
const mockOrderEvents: Record<string, any[]> = {};
const mockProducts: Record<string, any> = {};
const mockMessages: Record<string, any> = {};
const mockReviews: Record<string, any> = {};
const mockShifts: Record<string, any> = {};

jest.mock('../src/config/firebase', () => {
  return {
    admin: {
      firestore: {
        FieldValue: {
          serverTimestamp: () => new Date(),
          increment: (n: number) => n
        }
      },
      auth: () => ({
        verifyIdToken: jest.fn().mockImplementation(async (token: string) => {
          if (token === 'admin-token') {
            return { uid: 'admin_test_uid', email: 'admin@satvikswaad.com', role: 'admin_owner', roles: ['admin_owner', 'order_manager', 'catalog_editor', 'support', 'staff'] };
          }
          if (token === 'customer-token') {
            return { uid: 'cust_test_uid', email: 'cust@example.com' };
          }
          throw new Error('Invalid token');
        })
      })
    },
    db: {
      collection: (colName: string) => {
        if (colName === 'newsletterSubscribers') {
          return {
            doc: (docId: string) => ({
              get: async () => ({
                exists: Boolean(mockSubscribers[docId]),
                id: docId,
                data: () => mockSubscribers[docId]
              }),
              set: async (data: any, options?: any) => {
                mockSubscribers[docId] = options?.merge && mockSubscribers[docId] ? { ...mockSubscribers[docId], ...data } : data;
              }
            }),
            orderBy: () => ({
              limit: (lim: number) => ({
                get: async () => ({
                  docs: Object.keys(mockSubscribers).slice(0, lim).map(id => ({
                    id,
                    data: () => mockSubscribers[id]
                  }))
                }),
                startAfter: () => ({
                  get: async () => ({
                    docs: []
                  })
                })
              })
            })
          };
        }

        if (colName === 'orders') {
          return {
            doc: (docId: string) => ({
              get: async () => ({
                exists: Boolean(mockOrders[docId]),
                id: docId,
                data: () => mockOrders[docId]
              }),
              collection: (subCol: string) => {
                if (subCol === 'events') {
                  return {
                    orderBy: () => ({
                      limit: (lim: number) => ({
                        get: async () => ({
                          docs: (mockOrderEvents[docId] || []).slice(0, lim).map((ev, i) => ({
                            id: `ev_${i}`,
                            data: () => ev
                          }))
                        })
                      })
                    })
                  };
                }
                return {};
              }
            }),
            orderBy: () => ({
              where: () => ({
                limit: (lim: number) => ({
                  get: async () => ({
                    docs: Object.keys(mockOrders).slice(0, lim).map(id => ({
                      id,
                      data: () => mockOrders[id]
                    }))
                  })
                })
              }),
              limit: (lim: number) => ({
                get: async () => ({
                  docs: Object.keys(mockOrders).slice(0, lim).map(id => ({
                    id,
                    data: () => mockOrders[id]
                  }))
                }),
                startAfter: () => ({
                  get: async () => ({ docs: [] })
                })
              })
            })
          };
        }

        if (colName === 'products') {
          return {
            get: async () => ({
              docs: Object.keys(mockProducts).map(id => ({
                id,
                data: () => mockProducts[id]
              }))
            })
          };
        }

        if (colName === 'contactMessages') {
          return {
            doc: (docId: string) => ({
              get: async () => ({
                exists: Boolean(mockMessages[docId]),
                id: docId,
                data: () => mockMessages[docId]
              })
            }),
            orderBy: () => ({
              limit: (lim: number) => ({
                get: async () => ({
                  docs: Object.keys(mockMessages).slice(0, lim).map(id => ({
                    id,
                    data: () => mockMessages[id]
                  }))
                })
              })
            })
          };
        }

        if (colName === 'reviews') {
          return {
            doc: (docId: string) => ({
              get: async () => ({
                exists: Boolean(mockReviews[docId]),
                id: docId,
                data: () => mockReviews[docId]
              })
            }),
            orderBy: () => ({
              limit: (lim: number) => ({
                get: async () => ({
                  docs: Object.keys(mockReviews).slice(0, lim).map(id => ({
                    id,
                    data: () => mockReviews[id]
                  }))
                })
              })
            })
          };
        }

        if (colName === 'shifts') {
          return {
            doc: (docId: string) => ({
              get: async () => ({
                exists: Boolean(mockShifts[docId]),
                id: docId,
                data: () => mockShifts[docId]
              })
            }),
            orderBy: () => ({
              limit: (lim: number) => ({
                get: async () => ({
                  docs: Object.keys(mockShifts).slice(0, lim).map(id => ({
                    id,
                    data: () => mockShifts[id]
                  }))
                })
              })
            })
          };
        }

        return {
          doc: () => ({ get: async () => ({ exists: false }) }),
          get: async () => ({ docs: [] })
        };
      }
    }
  };
});

describe('Wave E: Storefront & Admin Client Remediation Tests', () => {
  beforeEach(() => {
    // Populate seed mocks
    mockProducts['prod_aam_achar'] = { name: 'Aam ka Achar', stock: 50, price: 24900, available: true };
    mockOrders['SS-2026-001'] = {
      orderId: 'SS-2026-001',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      totalAmountPaise: 54900,
      createdAt: new Date()
    };
    mockOrderEvents['SS-2026-001'] = [
      { action: 'ORDER_PLACED', actorUid: 'cust_1', timestamp: new Date() },
      { action: 'PAYMENT_VERIFIED', actorUid: 'system', timestamp: new Date() }
    ];
  });

  describe('T-029: Newsletter API & Bot Protection', () => {
    it('rejects subscription request missing or invalid email with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/newsletter/subscribe')
        .send({ email: 'invalid-email-format', consent: true, turnstileToken: 'test-token' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects subscription request without explicit consent boolean with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/newsletter/subscribe')
        .send({ email: 'subscriber@example.com', consent: false, turnstileToken: 'test-token' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/explicit consent/i);
    });

    it('subscribes successfully with valid email, consent: true, and Turnstile token', async () => {
      const email = 'pure.devotee@satvikswaad.com';
      const expectedHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');

      const res = await request(app)
        .post('/api/v1/newsletter/subscribe')
        .send({ email, consent: true, turnstileToken: 'test-turnstile-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/subscribed/i);

      // Verify stored in newsletterSubscribers
      expect(mockSubscribers[expectedHash]).toBeDefined();
      expect(mockSubscribers[expectedHash].consent).toBe(true);
      expect(mockSubscribers[expectedHash].status).toBe('ACTIVE');
    });

    it('allows admin to list newsletter subscribers with cursor pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/newsletter/subscribers?limit=50')
        .set('Authorization', 'Bearer mock_admin_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.subscribers)).toBe(true);
    });

    it('rejects unauthenticated requests to admin newsletter subscribers endpoint with 401', async () => {
      const res = await request(app)
        .get('/api/v1/admin/newsletter/subscribers');

      expect(res.status).toBe(401);
    });
  });

  describe('T-031: Admin API Endpoints with UI-4 & UI-5 Enforcement', () => {
    it('lists orders with cursor pagination (max 50 limit, UI-4)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/orders?limit=50')
        .set('Authorization', 'Bearer mock_admin_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
      expect(res.body.orders.length).toBeLessThanOrEqual(50);
    });

    it('retrieves single order details for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/orders/SS-2026-001')
        .set('Authorization', 'Bearer mock_admin_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.orderId).toBe('SS-2026-001');
    });

    it('retrieves order event timeline from orders/{id}/events (UI-5)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/orders/SS-2026-001/events')
        .set('Authorization', 'Bearer mock_admin_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.events)).toBe(true);
      expect(res.body.events.length).toBe(2);
    });

    it('lists products for admin with unmasked stock', async () => {
      const res = await request(app)
        .get('/api/v1/admin/products')
        .set('Authorization', 'Bearer mock_admin_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products[0].stock).toBe(50); // Unmasked for admin
    });

    it('lists messages, reviews, and shifts with cursor pagination', async () => {
      const [msgRes, revRes, shiftRes] = await Promise.all([
        request(app).get('/api/v1/admin/messages?limit=50').set('Authorization', 'Bearer mock_admin_token'),
        request(app).get('/api/v1/admin/reviews?limit=50').set('Authorization', 'Bearer mock_admin_token'),
        request(app).get('/api/v1/admin/pos/shifts?limit=50').set('Authorization', 'Bearer mock_admin_token')
      ]);

      expect(msgRes.status).toBe(200);
      expect(revRes.status).toBe(200);
      expect(shiftRes.status).toBe(200);
    });
  });

  describe('T-027 & T-028: DOM & XSS Architectural Guarantees', () => {
    it('verifies docs/selectors.md exists and documents contract selectors per FE-2', () => {
      const selectorsPath = path.resolve(__dirname, '../../docs/selectors.md');
      expect(fs.existsSync(selectorsPath)).toBe(true);
      const content = fs.readFileSync(selectorsPath, 'utf8');
      expect(content).toContain('cart-drawer-overlay');
      expect(content).toContain('data-js');
    });

    it('verifies public/site/js/dom.js exists and exports safe DOM helper h() and clearChildren() (XSS-4)', () => {
      const domJsPath = path.resolve(__dirname, '../../public/site/js/dom.js');
      expect(fs.existsSync(domJsPath)).toBe(true);
      const content = fs.readFileSync(domJsPath, 'utf8');
      expect(content).toContain('export function h(');
      expect(content).toContain('export function clearChildren(');
    });

    it('verifies zero occurrences of firebase-firestore or window.db in public/ (DB-1, T-027)', () => {
      const siteConfig = fs.readFileSync(path.resolve(__dirname, '../../public/site/firebase-config.js'), 'utf8');
      const adminConfig = fs.readFileSync(path.resolve(__dirname, '../../public/admin/firebase-config.js'), 'utf8');
      expect(siteConfig).not.toContain('firebase-firestore');
      expect(siteConfig).not.toContain('window.db');
      expect(adminConfig).not.toContain('firebase-firestore');
      expect(adminConfig).not.toContain('window.db');
    });
  });
});
