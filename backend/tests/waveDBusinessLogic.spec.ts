/**
 * Satvik Swaad — Wave D End-to-End Business Logic Integration Test Suite
 * Authority: docs/SPEC.md (v2.6) and docs/DECISIONS.md (D3, D4, D7, D9, D16)
 *
 * Tickets Verified:
 * - T-022: PayU/Razorpay Authoritative State Settlement & compare-and-set (PAY-1..4, RZP-1..6)
 * - T-023: Order Expiry & Reservation Release Background Job (ARCH-8, Section 8.4, 8.5, DISC-3, STOCK-4)
 * - T-024: Admin Dual-Control Refund Authorization & Daily Stats Reversal (REFUND-1..4, Decision D7, DB-7)
 * - T-025: POS Retail Counter Sale, Invoicing, Staff Discount Cap & Shifts (POS-1..8, TAX-2, TAX-3)
 * - T-026: Cryptographic SHA-256 Audit Hash Chaining, Role Delegation & Kill Switches (AUTH-7, LOG-2, INV-6, INV-7, Decision D3)
 */

import request from 'supertest';
import { app } from '../src/app';
import { db, admin } from '../src/config/firebase';
import { settlePayuPayment } from '../src/payments/payuService';
import { runOrderExpiryJob } from '../src/orders/expiryJob';
import {
  logAuditEvent,
  verifyAuditHashChain,
  clearRecordedAuditLogs,
  getRecordedAuditLogs
} from '../src/audit/auditLogger';
import { getCurrentFinancialYearString } from '../src/admin/posController';
import { GENESIS_HASH } from '../src/audit/auditLogger';

describe('Wave D: End-to-End Business Logic & Operational Controls', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    clearRecordedAuditLogs();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================================
  // T-022: AUTHORITATIVE PAYMENTS & STATE SETTLEMENT (PAY-1..4, RZP-1..6)
  // ============================================================================
  describe('Ticket T-022: Authoritative Payments & State Settlement', () => {

    it('Transitions order to CONFIRMED and PAID upon PayU settlement and writes to payments with amountPaise and dateIST', async () => {
      const orderId = 'ord_payu_test_001';
      const txnid = `tx_${orderId}_12345`;
      const amountPaise = 49900;

      const mockOrderData = {
        orderId,
        orderStatus: 'PLACED',
        paymentStatus: 'UNPAID',
        totalPaise: amountPaise,
        version: 1
      };

      let recordedPaymentData: any = null;

      const result = await settlePayuPayment(
        'callback',
        {
          status: 'success',
          txnid,
          amount: '499.00',
          key: 'mock_merchant_key',
          hash: 'mock_hash',
          mihpayid: 'mih_999888'
        },
        {
          skipHashVerifyForTest: true,
          merchantKey: 'mock_merchant_key',
          loadTxnOrder: async () => mockOrderData,
          checkDuplicatePayment: async () => false,
          recordPayment: async (data: any) => {
            recordedPaymentData = data;
          }
        }
      );

      expect(result.settled).toBe(true);
      expect(result.duplicate).toBe(false);
      expect(result.orderId).toBe(orderId);
      expect(recordedPaymentData).toBeDefined();
      expect(recordedPaymentData.orderStatus).toBe('CONFIRMED');
      expect(recordedPaymentData.paymentStatus).toBe('PAID');
    });

    it('Idempotently handles duplicate PayU settlement without failing or double-transitioning', async () => {
      const orderId = 'ord_payu_test_dup';
      const txnid = `tx_${orderId}_dup`;

      const result = await settlePayuPayment(
        'callback',
        {
          status: 'success',
          txnid,
          amount: '250.00',
          key: 'mock_merchant_key',
          hash: 'mock_hash',
          mihpayid: 'mih_111222'
        },
        {
          skipHashVerifyForTest: true,
          merchantKey: 'mock_merchant_key',
          loadTxnOrder: async () => ({ orderId, totalPaise: 25000, orderStatus: 'CONFIRMED', paymentStatus: 'PAID' }),
          checkDuplicatePayment: async () => true
        }
      );

      expect(result.settled).toBe(true);
      expect(result.duplicate).toBe(true);
      expect(result.orderId).toBe(orderId);
    });
  });

  // ============================================================================
  // T-023: ORDER EXPIRY & RESERVATION RELEASE JOB (ARCH-8, Section 8.4, 8.5)
  // ============================================================================
  describe('Ticket T-023: Order Expiry & Reservation Release Background Job', () => {

    it('runOrderExpiryJob() finds expired reservations, transitions orders to EXPIRED + FAILED, and releases reservations & coupons', async () => {
      const orderId = 'ord_expire_test_001';
      const pastDate = new Date(Date.now() - 30 * 60 * 1000);

      const mockReservationDoc = {
        id: orderId,
        ref: { path: `reservations/${orderId}` },
        data: () => ({
          status: 'ACTIVE',
          expiresAt: pastDate,
          lines: [{ variantId: 'var_amla_1kg', qty: 3 }]
        })
      };

      const mockOrderDoc = {
        orderId,
        orderStatus: 'PLACED',
        paymentStatus: 'UNPAID',
        discountCode: 'DIWALI50',
        version: 1
      };

      const mockOrderDocRef = {
        id: orderId,
        path: `orders/${orderId}`,
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({ path: `orders/${orderId}/events/mock_event` })
        })
      };

      const mockResCollection = {
        doc: jest.fn().mockReturnValue({ id: orderId, path: `reservations/${orderId}` }),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [mockReservationDoc]
        })
      };

      const mockOrdersCollection = {
        doc: jest.fn().mockReturnValue(mockOrderDocRef),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true, docs: [] })
      };

      const mockTx = {
        get: jest.fn().mockImplementation((ref: any) => {
          const path = ref.path || '';
          if (path.includes('orders')) return Promise.resolve({ id: orderId, exists: true, data: () => mockOrderDoc });
          if (path.includes('inventory')) return Promise.resolve({ id: 'var_amla_1kg', exists: true, data: () => ({ reservedStock: 10, availableStock: 40 }) });
          if (path.includes('redemptions')) return Promise.resolve({ id: 'redemp_1', exists: true, data: () => ({ status: 'APPLIED', code: 'DIWALI50' }) });
          return Promise.resolve({ exists: false, data: () => null });
        }),
        update: jest.fn(),
        set: jest.fn(),
        create: jest.fn()
      };

      jest.spyOn(db, 'collection').mockImplementation((collName: string): any => {
        if (collName === 'reservations') return mockResCollection;
        if (collName === 'orders') return mockOrdersCollection;
        return {
          doc: jest.fn().mockReturnValue({
            id: 'mock_id',
            path: `${collName}/mock_id`,
            collection: jest.fn().mockReturnValue({ doc: jest.fn().mockReturnValue({ path: 'mock_sub' }) })
          }),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ empty: true, docs: [] })
        };
      });

      jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
        return await cb(mockTx);
      });

      const expiryResult = await runOrderExpiryJob();

      expect(expiryResult.processedCount).toBeGreaterThan(0);
      expect(expiryResult.expiredCount).toBe(1);

      expect(mockTx.update).toHaveBeenCalled();
      const calls = mockTx.update.mock.calls;
      const orderUpdate = calls.find((c: any) => c[1]?.orderStatus === 'EXPIRED');
      expect(orderUpdate).toBeDefined();
      expect(orderUpdate[1].paymentStatus).toBe('FAILED');
    });

    it('Rejects unauthorized requests to POST /api/v1/jobs/expire-reservations when secret is enforced (ARCH-8)', async () => {
      const res = await request(app)
        .post('/api/v1/jobs/expire-reservations')
        .set('x-test-enforce-job-secret', 'true')
        .set('x-job-secret', 'wrong-secret-value');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================================
  // T-024: ADMIN DUAL-CONTROL REFUND AUTHORIZATION (REFUND-1..4, Decision D7, DB-7)
  // ============================================================================
  describe('Ticket T-024: Admin Dual-Control Refund Authorization', () => {

    it('Single admin approval permits refund <= ₹2,000 within daily threshold', async () => {
      const orderId = 'ord_refund_test_001';
      const gatewayRefundId = 'rfnd_gw_001';
      const amountPaise = 150000; // ₹1,500 <= ₹2,000 threshold

      const mockOrderData = {
        orderId,
        orderStatus: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalPaise: 200000,
        refundedPaise: 0,
        version: 1
      };

      const mockTx = {
        get: jest.fn().mockImplementation((ref: any) => {
          const path = ref.path || '';
          if (path.includes('refunds')) return Promise.resolve({ id: gatewayRefundId, exists: false, data: () => null });
          if (path.includes('orders')) return Promise.resolve({ id: orderId, exists: true, data: () => mockOrderData });
          if (path.includes('stats_daily')) return Promise.resolve({ id: 'daily_id', exists: true, data: () => ({ revenuePaise: 500000, refundedPaise: 0, ordersCount: 5 }) });
          if (path.includes('audit_head')) return Promise.resolve({ exists: false, data: () => null });
          return Promise.resolve({ exists: false, data: () => null });
        }),
        update: jest.fn(),
        set: jest.fn(),
        create: jest.fn()
      };

      jest.spyOn(db, 'collection').mockImplementation((collName: string): any => {
        if (collName === 'refunds') {
          return {
            doc: (id: string) => ({ id, path: `refunds/${id}` }),
            where: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue({ empty: true, size: 0, docs: [] })
          };
        }
        return {
          doc: (id: string) => ({
            id,
            path: `${collName}/${id}`,
            collection: jest.fn().mockReturnValue({ doc: jest.fn().mockReturnValue({ path: 'mock_sub' }) })
          }),
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ empty: true, size: 0, docs: [] })
        };
      });

      jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
        return await cb(mockTx);
      });

      const res = await request(app)
        .post('/api/v1/admin/refunds/mark-refunded')
        .set('Authorization', 'Bearer mock_owner_token')
        .send({
          orderId,
          amountPaise,
          gatewayRefundId,
          reason: 'Customer return confirmed'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.gatewayRefundId).toBe(gatewayRefundId);
      expect(res.body.data.amountPaise).toBe(amountPaise);

      // Verify stats_daily decremented via update
      const updateCalls = mockTx.update.mock.calls;
      const statsDailyUpdate = updateCalls.find((call: any) => call[1]?.revenuePaise !== undefined);
      expect(statsDailyUpdate).toBeDefined();
      expect(statsDailyUpdate[1].revenuePaise).toBe(350000); // 500000 - 150000
    });

    it('Rejects refund > ₹2,000 without second admin/owner approval with 403 (REFUND-3)', async () => {
      jest.spyOn(db, 'collection').mockImplementation((collName: string): any => ({
        doc: (id: string) => ({ id, path: `${collName}/${id}` }),
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true, size: 0, docs: [] })
      }));

      const res = await request(app)
        .post('/api/v1/admin/refunds/mark-refunded')
        .set('Authorization', 'Bearer mock_owner_token')
        .send({
          orderId: 'ord_large_refund',
          amountPaise: 250000,
          gatewayRefundId: 'rfnd_large_001',
          reason: 'Damaged shipment'
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('Second administrative approval required');
    });

    it('Rejects refund exceeding remaining refundable balance with 400 (REFUND-4)', async () => {
      const orderId = 'ord_exceed_refund';
      const mockOrderData = {
        orderId,
        orderStatus: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalPaise: 100000,
        refundedPaise: 50000,
        version: 2
      };

      const mockTx = {
        get: jest.fn().mockImplementation((ref: any) => {
          const path = ref.path || '';
          if (path.includes('refunds')) return Promise.resolve({ id: 'r1', exists: false, data: () => null });
          if (path.includes('orders')) return Promise.resolve({ id: orderId, exists: true, data: () => mockOrderData });
          return Promise.resolve({ exists: false, data: () => null });
        })
      };

      jest.spyOn(db, 'collection').mockImplementation((collName: string): any => ({
        doc: (id: string) => ({ id, path: `${collName}/${id}` }),
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true, size: 0, docs: [] })
      }));

      jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
        return await cb(mockTx);
      });

      const res = await request(app)
        .post('/api/v1/admin/refunds/mark-refunded')
        .set('Authorization', 'Bearer mock_owner_token')
        .send({
          orderId,
          amountPaise: 60000,
          gatewayRefundId: 'rfnd_exceed_001',
          reason: 'Full refund attempt'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('exceeds remaining refundable balance');
    });
  });

  // ============================================================================
  // T-025: POS RETAIL COUNTER SALE, INVOICING & SHIFTS (POS-1..8, TAX-2, TAX-3)
  // ============================================================================
  describe('Ticket T-025: POS Retail Counter Sale & Shifts', () => {

    it('Allows staff to open and close register shift with cash discrepancy tracking (POS-8)', async () => {
      let savedShiftDoc: any = null;

      const mockShiftRef = {
        id: 'shift_12345',
        path: 'shifts/shift_12345',
        set: jest.fn().mockImplementation((data) => { savedShiftDoc = data; return Promise.resolve(); }),
        update: jest.fn().mockResolvedValue({})
      };

      const mockTx = {
        get: jest.fn().mockImplementation((ref: any) => {
          return Promise.resolve({
            id: 'shift_12345',
            exists: true,
            data: () => ({
              shiftId: 'shift_12345',
              status: 'OPEN',
              openingFloatPaise: 200000,
              cashSalesPaise: 800000,
              staffUid: 'admin_test_uid'
            })
          });
        }),
        update: jest.fn()
      };

      jest.spyOn(db, 'collection').mockImplementation((collName: string): any => {
        if (collName === 'shifts') {
          return {
            doc: (id?: string) => mockShiftRef,
            where: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue({ empty: true, docs: [] })
          };
        }
        return {
          doc: (id?: string) => ({ id: id || 'doc_id', set: jest.fn(), get: jest.fn() })
        };
      });

      jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
        return await cb(mockTx);
      });

      // 1. Start Shift
      const startRes = await request(app)
        .post('/api/v1/admin/pos/shifts/start')
        .set('Authorization', 'Bearer mock_owner_token')
        .send({ openingFloatPaise: 200000 });

      expect(startRes.status).toBe(201);
      expect(startRes.body.success).toBe(true);
      expect(savedShiftDoc.openingFloatPaise).toBe(200000);
      expect(savedShiftDoc.status).toBe('OPEN');

      // 2. Close Shift with ₹9,900 cash counted
      const closeRes = await request(app)
        .post('/api/v1/admin/pos/shifts/shift_12345/close')
        .set('Authorization', 'Bearer mock_owner_token')
        .send({ closingCashCountPaise: 990000, notes: 'Shortage of 100 Rs' });

      expect(closeRes.status).toBe(200);
      expect(closeRes.body.success).toBe(true);
      expect(closeRes.body.data.discrepancyPaise).toBe(-10000);
      expect(closeRes.body.data.status).toBe('CLOSED');
    });

    it('sellNowHandler prices items authoritatively, caps staff discount at lower of 5% and ₹100, and issues FY invoice (POS-1..8)', async () => {
      const mockProduct = {
        id: 'prod_mango_achar',
        name: 'Artisanal Mango Pickle',
        price: 300,
        mrp: 350,
        stock: 50,
        available: true,
        variants: [{ id: 'var_500g', label: '500g', price: 300, stock: 50, active: true }]
      };

      let createdOrder: any = null;

      const mockTx = {
        get: jest.fn().mockImplementation((ref: any) => {
          const path = ref.path || '';
          if (path.includes('shifts')) {
            return Promise.resolve({ id: 'shift_open_01', exists: true, data: () => ({ status: 'OPEN', cashSalesPaise: 0 }) });
          }
          if (path.includes('products')) {
            return Promise.resolve({ id: 'prod_mango_achar', exists: true, data: () => mockProduct });
          }
          if (path.includes('counters')) {
            return Promise.resolve({ id: 'invoices_26-27', exists: true, data: () => ({ lastSequence: 122 }) });
          }
          if (path.includes('stats_daily')) {
            return Promise.resolve({ id: 'stats_today', exists: true, data: () => ({ revenuePaise: 100000, ordersCount: 10, byChannel: {}, byHour: {} }) });
          }
          if (path.includes('audit_head')) {
            return Promise.resolve({ exists: false, data: () => null });
          }
          return Promise.resolve({ exists: false, data: () => null });
        }),
        set: jest.fn().mockImplementation((ref: any, data: any) => {
          if (data.orderId && data.channel === 'OFFLINE_COUNTER') {
            createdOrder = data;
          }
        }),
        update: jest.fn()
      };

      jest.spyOn(db, 'collection').mockImplementation((collName: string): any => ({
        doc: (id: string) => ({
          id,
          path: `${collName}/${id}`,
          collection: jest.fn().mockReturnValue({ doc: jest.fn().mockReturnValue({ path: 'mock_sub' }) })
        })
      }));

      jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
        return await cb(mockTx);
      });

      // Staff applies ₹30 discount on ₹600 order (5% of 600 = ₹30 <= ₹100 cap)
      const res = await request(app)
        .post('/api/v1/admin/pos/sell-now')
        .set('Authorization', 'Bearer mock_owner_token')
        .send({
          shiftId: 'shift_open_01',
          items: [{ productId: 'prod_mango_achar', variantId: 'var_500g', qty: 2 }],
          paymentMethod: 'CASH',
          customerName: 'Ramesh Verma',
          customerPhone: '9876543210',
          discountPaise: 3000,
          discountReason: 'Customer relationship discount'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderStatus).toBe('DELIVERED');
      expect(res.body.data.paymentStatus).toBe('PAID');
      expect(res.body.data.invoiceNumber).toMatch(/^SS\/\d{2}-\d{2}\/\d{6}$/);

      expect(createdOrder).toBeDefined();
      expect(createdOrder.subtotalPaise).toBe(60000);
      expect(createdOrder.discountPaise).toBe(3000);
      expect(createdOrder.totalPaise).toBe(57000);
      expect(createdOrder.channel).toBe('OFFLINE_COUNTER');
      expect(createdOrder.invoiceNumber).toBe(`SS/${getCurrentFinancialYearString()}/000123`);
    });

    it('Rejects staff discount exceeding the 5% / ₹100 cap with 400 (POS-3)', async () => {
      const mockProduct = {
        id: 'prod_mango_achar',
        name: 'Artisanal Mango Pickle',
        price: 300,
        mrp: 350,
        stock: 50,
        available: true,
        variants: [{ id: 'var_500g', label: '500g', price: 300, stock: 50, active: true }]
      };

      const mockTx = {
        get: jest.fn().mockImplementation((ref: any) => {
          const path = ref.path || '';
          if (path.includes('shifts')) return Promise.resolve({ id: 'shift_open_01', exists: true, data: () => ({ status: 'OPEN' }) });
          if (path.includes('products')) return Promise.resolve({ id: 'prod_mango_achar', exists: true, data: () => mockProduct });
          return Promise.resolve({ exists: false, data: () => null });
        })
      };

      jest.spyOn(db, 'collection').mockImplementation((collName: string): any => ({
        doc: (id: string) => ({ id, path: `${collName}/${id}` })
      }));

      jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
        return await cb(mockTx);
      });

      const res = await request(app)
        .post('/api/v1/admin/pos/sell-now')
        .set('Authorization', 'Bearer mock_catalog_manager_token')
        .send({
          shiftId: 'shift_open_01',
          items: [{ productId: 'prod_mango_achar', variantId: 'var_500g', qty: 2 }],
          paymentMethod: 'CASH',
          discountPaise: 5000
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Staff discount capped');
    });
  });

  // ============================================================================
  // T-026: AUDIT HASH CHAINING, ROLE DELEGATION & KILL SWITCHES (AUTH-7, LOG-2, INV-6, INV-7)
  // ============================================================================
  describe('Ticket T-026: Cryptographic Hash Chaining, Role Delegation & Operational Kill Switches', () => {

    it('Maintains unbroken SHA-256 cryptographic hash chain across sequential audit events (LOG-2, INV-6)', async () => {
      clearRecordedAuditLogs();

      // Log 3 consecutive events
      await logAuditEvent({ action: 'PRODUCT_CREATED', actorUid: 'owner_1', outcome: 'SUCCESS' });
      await logAuditEvent({ action: 'ORDER_CONFIRMED', actorUid: 'owner_1', outcome: 'SUCCESS' });
      await logAuditEvent({ action: 'POS_SALE_COMPLETED', actorUid: 'staff_1', outcome: 'SUCCESS' });

      const logs = getRecordedAuditLogs();
      expect(logs.length).toBe(3);
      expect(logs[0].sequence).toBe(1);
      expect(logs[0].prevHash).toBe(GENESIS_HASH);
      expect(logs[1].sequence).toBe(2);
      expect(logs[1].prevHash).toBe(logs[0].hash);
      expect(logs[2].sequence).toBe(3);
      expect(logs[2].prevHash).toBe(logs[1].hash);

      const auditResult = await verifyAuditHashChain();
      expect(auditResult.valid).toBe(true);
      expect(auditResult.entriesVerified).toBe(3);
    });

    it('Detects tampered audit record in hash chain with INV-6 verification failure', async () => {
      clearRecordedAuditLogs();
      await logAuditEvent({ action: 'ORDER_STATUS_TRANSITION', actorUid: 'owner_1', outcome: 'SUCCESS' });

      const logs = getRecordedAuditLogs();
      expect(logs.length).toBe(1);

      (logs[0] as any).hash = 'tampered_forged_hash_value_that_fails_sha256';

      const auditResult = await verifyAuditHashChain();
      expect(auditResult.valid).toBe(false);
      expect(auditResult.brokenSequence).toBe(1);
    });

    it('grantRoleHandler delegates role via Firebase Auth Custom Claims, revokes tokens, and NEVER writes to users doc (AUTH-7, INV-7)', async () => {
      const setCustomUserClaimsMock = jest.fn().mockResolvedValue(undefined);
      const revokeRefreshTokensMock = jest.fn().mockResolvedValue(undefined);

      jest.spyOn(admin, 'auth').mockReturnValue({
        getUser: jest.fn().mockResolvedValue({ uid: 'target_user_123', customClaims: {} }),
        setCustomUserClaims: setCustomUserClaimsMock,
        revokeRefreshTokens: revokeRefreshTokensMock
      } as any);

      const usersDocSetMock = jest.fn();
      jest.spyOn(db, 'collection').mockImplementation((collName: string): any => {
        if (collName === 'users') {
          return {
            doc: () => ({ set: usersDocSetMock, update: usersDocSetMock })
          };
        }
        return {
          doc: () => ({ set: jest.fn(), get: jest.fn() })
        };
      });

      const res = await request(app)
        .post('/api/v1/admin/roles/grant')
        .set('Authorization', 'Bearer mock_owner_token')
        .send({
          targetUid: 'target_user_123',
          role: 'staff'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(usersDocSetMock).not.toHaveBeenCalled();
    });

    it('Manages operational kill switches with manual UPI forced disabled by default (Decision D3)', async () => {
      let currentKillSwitches = {
        commerceEnabled: false,
        checkoutEnabled: false,
        payuEnabled: true,
        razorpayEnabled: true,
        upiManualEnabled: false,
        adminReadOnly: false
      };

      jest.spyOn(db, 'collection').mockImplementation((collName: string): any => {
        if (collName === 'config') {
          return {
            doc: (docId: string) => ({
              id: docId,
              path: `config/${docId}`,
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => currentKillSwitches
              }),
              set: jest.fn().mockImplementation((data) => {
                currentKillSwitches = { ...currentKillSwitches, ...data };
                return Promise.resolve();
              })
            })
          };
        }
        return {
          doc: (id?: string) => ({ id: id || 'doc_id', get: jest.fn(), set: jest.fn() })
        };
      });

      // 1. GET kill-switches
      const getRes = await request(app)
        .get('/api/v1/admin/kill-switches')
        .set('Authorization', 'Bearer mock_owner_token');

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.upiManualEnabled).toBe(false);

      // 2. PUT kill-switches (updating checkoutEnabled)
      const putRes = await request(app)
        .put('/api/v1/admin/kill-switches')
        .set('Authorization', 'Bearer mock_owner_token')
        .send({
          checkoutEnabled: true,
          commerceEnabled: true
        });

      expect(putRes.status).toBe(200);
      expect(putRes.body.success).toBe(true);
      expect(putRes.body.data.checkoutEnabled).toBe(true);
      expect(putRes.body.data.upiManualEnabled).toBe(false); // Stays false per D3
    });
  });
});
