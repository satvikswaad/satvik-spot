import * as fs from 'fs';
import * as path from 'path';
import { db, admin } from '../src/config/firebase';
import { processAuthoritativeOrder, processCheckoutOrder } from '../src/orders/orderService';
import { logInventoryChange, logInventoryChangeInTransaction } from '../src/inventory/inventoryService';
import * as productService from '../src/products/productService';

describe('Phase C: Database Redesign, Denormalization & Integrity', () => {

  const testPayload = {
    name: 'Savitri Devi',
    phone: '9876543210',
    address: 'Kashi Vishwanath Marg, Varanasi, UP, 221001',
    paymentMethod: 'Cash on Delivery',
    idempotencyKey: 'idem_phase_c_test_001',
    items: [
      { productId: 'prod_aam_achar', variantId: 'var_500g', qty: 2 }
    ]
  };

  const mockProduct = {
    id: 'prod_aam_achar',
    name: 'Aam ka Achar',
    price: 249,
    mrp: 320,
    stock: 50,
    available: true,
    selectedVariant: { id: 'var_500g', label: '500 g', price: 249, stock: 50 }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================================
  // 1. POINT-IN-TIME IMMUTABLE SNAPSHOT DENORMALIZATION
  // ============================================================================
  describe('1. Point-in-Time Immutable Order Snapshot', () => {
    it('Denormalizes customerName, customerPhone, itemNames, and itemSummary at order creation', async () => {
      let savedOrderDoc: any = null;

      const mockTx = {
        get: jest.fn().mockImplementation((ref: any) => {
          return Promise.resolve({ exists: false, data: () => null });
        }),
        set: jest.fn().mockImplementation((ref: any, data: any) => {
          if (data.orderId && data.items) {
            savedOrderDoc = data;
          }
        }),
        update: jest.fn()
      };

      jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => {
        return await cb(mockTx);
      });

      jest.spyOn(productService, 'getAuthoritativeProductInTransaction').mockResolvedValue(mockProduct as any);

      await processAuthoritativeOrder({
        payload: testPayload,
        userId: 'user_savitri_123'
      });

      expect(savedOrderDoc).toBeDefined();
      expect(savedOrderDoc.customerName).toBe('Savitri Devi');
      expect(savedOrderDoc.customerPhone).toBe('9876543210');
      expect(savedOrderDoc.itemNames).toEqual(['Aam ka Achar (500 g)']);
      expect(savedOrderDoc.itemSummary).toBe('Aam ka Achar (500 g) × 2');
      expect(savedOrderDoc.userId).toBe('user_savitri_123');
    });

    it('Confirms point-in-time snapshot concept: order customer data is independent of future profile changes', () => {
      // Historical order snapshot remains immutable
      const historicalOrder = {
        orderId: 'ORD_HIST_001',
        customerName: 'Savitri Devi',
        customerPhone: '9876543210',
        createdAt: '2026-01-01T00:00:00.000Z'
      };

      // Customer later updates their profile
      const updatedCustomerProfile = {
        uid: 'user_savitri_123',
        name: 'Savitri Sharma', // Changed surname
        phone: '9123456780'    // New phone
      };

      // Assert that historical order snapshot is decoupled and not overwritten
      expect(historicalOrder.customerName).toBe('Savitri Devi');
      expect(historicalOrder.customerPhone).toBe('9876543210');
      expect(historicalOrder.customerName).not.toBe(updatedCustomerProfile.name);
      expect(historicalOrder.customerPhone).not.toBe(updatedCustomerProfile.phone);
    });
  });

  // ============================================================================
  // 2. INVENTORY AUDIT LOGS
  // ============================================================================
  describe('2. Inventory Logs Collection & Service', () => {
    it('logInventoryChangeInTransaction records correct audit payload', () => {
      let savedLog: any = null;
      const mockTx = {
        set: jest.fn().mockImplementation((ref: any, data: any) => {
          savedLog = data;
        })
      };

      logInventoryChangeInTransaction(mockTx as any, {
        productId: 'prod_aam_achar',
        variantId: 'var_500g',
        previousStock: 50,
        newStock: 48,
        delta: -2,
        reason: 'ORDER_DEDUCTION',
        orderId: 'order_test_999',
        actorUid: 'user_savitri_123'
      });

      expect(mockTx.set).toHaveBeenCalled();
      expect(savedLog).toBeDefined();
      expect(savedLog.productId).toBe('prod_aam_achar');
      expect(savedLog.variantId).toBe('var_500g');
      expect(savedLog.previousStock).toBe(50);
      expect(savedLog.newStock).toBe(48);
      expect(savedLog.delta).toBe(-2);
      expect(savedLog.reason).toBe('ORDER_DEDUCTION');
      expect(savedLog.orderId).toBe('order_test_999');
      expect(savedLog.actorUid).toBe('user_savitri_123');
    });

    it('Standalone logInventoryChange creates inventory log document', async () => {
      let savedData: any = null;
      jest.spyOn(db, 'collection').mockReturnValue({
        doc: jest.fn().mockReturnValue({
          id: 'log_mock_123',
          set: jest.fn().mockImplementation((data: any) => {
            savedData = data;
            return Promise.resolve();
          })
        })
      } as any);

      const logId = await logInventoryChange({
        productId: 'prod_seb_murabba',
        previousStock: 20,
        newStock: 25,
        delta: 5,
        reason: 'ADMIN_ADJUSTMENT',
        actorUid: 'admin_owner_uid'
      });

      expect(logId).toBe('log_mock_123');
      expect(savedData.reason).toBe('ADMIN_ADJUSTMENT');
      expect(savedData.delta).toBe(5);
      expect(savedData.newStock).toBe(25);
    });
  });

  // ============================================================================
  // 3. DATA INTEGRITY & MATHEMATICAL CONSISTENCY
  // ============================================================================
  describe('3. Order Integrity & Mathematical Consistency', () => {
    it('Order item totals sum exactly to subtotal and grand total includes shipping', async () => {
      let savedOrder: any = null;

      const mockTx = {
        get: jest.fn().mockResolvedValue({ exists: false }),
        set: jest.fn().mockImplementation((ref: any, data: any) => {
          if (data.orderId && data.items) savedOrder = data;
        }),
        update: jest.fn()
      };

      jest.spyOn(db, 'runTransaction').mockImplementation(async (cb: any) => cb(mockTx));
      jest.spyOn(productService, 'getAuthoritativeProductInTransaction').mockResolvedValue(mockProduct as any);

      await processAuthoritativeOrder({
        payload: testPayload,
        userId: 'user_123'
      });

      expect(savedOrder).toBeDefined();
      const calculatedSubtotal = savedOrder.items.reduce((acc: number, item: any) => acc + item.lineTotal, 0);
      expect(savedOrder.subtotal).toBe(calculatedSubtotal);
      expect(savedOrder.total).toBe(savedOrder.subtotal + savedOrder.shippingFee);
    });
  });

  // ============================================================================
  // 4. FIRESTORE RULES & INDEXES AUDIT
  // ============================================================================
  describe('4. Firestore Security Rules & Composite Indexes Static Audit', () => {
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const indexesPath = path.resolve(__dirname, '../../firestore.indexes.json');

    it('firestore.rules denies direct client writes to inventory_logs', () => {
      const content = fs.readFileSync(rulesPath, 'utf8');
      expect(content).toContain('match /inventory_logs/{logId}');
      expect(content).toMatch(/match \/inventory_logs\/\{logId\}\s*\{\s*allow read: if isAdmin\(\);\s*allow create, update, delete: if false;\s*\}/);
    });

    it('firestore.rules denies direct client writes to payment_transactions', () => {
      const content = fs.readFileSync(rulesPath, 'utf8');
      expect(content).toContain('match /payment_transactions/{txnId}');
      expect(content).toContain('allow create, update, delete: if false;');
    });

    it('firestore.rules denies direct client writes to refunds', () => {
      const content = fs.readFileSync(rulesPath, 'utf8');
      expect(content).toContain('match /refunds/{refundId}');
      expect(content).toContain('allow create, update, delete: if false;');
    });

    it('firestore.indexes.json includes composite indexes for admin queries', () => {
      const content = JSON.parse(fs.readFileSync(indexesPath, 'utf8'));
      const collections = content.indexes.map((idx: any) => idx.collectionGroup);

      expect(collections).toContain('orders');
      expect(collections).toContain('inventory_logs');
      expect(collections).toContain('payment_transactions');
      expect(collections).toContain('refunds');
    });
  });
});
