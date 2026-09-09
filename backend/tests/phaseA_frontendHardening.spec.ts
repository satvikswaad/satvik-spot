import { validateCreateOrderPayload } from '../src/validation/orderSchema';
import { ValidationError } from '../src/errors/AppError';

/**
 * Phase A — Frontend Code Hardening Tests
 *
 * Validates that the server-side order validation schema correctly rejects
 * tampered client payloads that attempt to inject prices, totals, statuses,
 * or other forbidden fields. Also validates quantity boundary enforcement.
 */
describe('Phase A: Frontend Code Hardening — Tampered Input Rejection', () => {

  // Valid baseline payload used as the starting point for all mutation tests
  const validPayload = {
    name: 'Test Customer',
    phone: '9876543210',
    address: 'Test Address, Varanasi, UP, 221001',
    email: 'test@example.com',
    house: 'Flat 101',
    street: 'Main Road',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    pincode: '221001',
    paymentMethod: 'WhatsApp-Assisted Ordering',
    idempotencyKey: 'idem_test_12345678',
    items: [
      { productId: 'prod_aam_achar', variantId: 'var_500g', qty: 2 }
    ]
  };

  // ============================================================================
  // 1. FORBIDDEN TOP-LEVEL FIELD INJECTION
  // ============================================================================
  describe('1. Forbidden Top-Level Field Injection', () => {

    it('Rejects payload with injected "price" field', () => {
      const tampered = { ...validPayload, price: 1 };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(ValidationError);
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden or unexpected field.*'price'/);
    });

    it('Rejects payload with injected "total" field', () => {
      const tampered = { ...validPayload, total: 0 };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(ValidationError);
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden or unexpected field.*'total'/);
    });

    it('Rejects payload with injected "subtotal" field', () => {
      const tampered = { ...validPayload, subtotal: 100 };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden or unexpected field.*'subtotal'/);
    });

    it('Rejects payload with injected "unitPrice" field', () => {
      const tampered = { ...validPayload, unitPrice: 50 };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden or unexpected field.*'unitPrice'/);
    });

    it('Rejects payload with injected "shippingFee" field', () => {
      const tampered = { ...validPayload, shippingFee: 0 };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden or unexpected field.*'shippingFee'/);
    });

    it('Rejects payload with injected "discount" field', () => {
      const tampered = { ...validPayload, discount: 500 };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden or unexpected field.*'discount'/);
    });

    it('Rejects payload with injected "couponCode" field', () => {
      const tampered = { ...validPayload, couponCode: 'FREEORDER' };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden or unexpected field.*'couponCode'/);
    });

    it('Rejects payload with injected "status" field', () => {
      const tampered = { ...validPayload, status: 'Delivered' };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden or unexpected field.*'status'/);
    });

    it('Rejects payload with injected "paymentStatus" field', () => {
      const tampered = { ...validPayload, paymentStatus: 'PAYMENT_CONFIRMED' };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden or unexpected field.*'paymentStatus'/);
    });

    it('Rejects payload with injected "userId" field', () => {
      const tampered = { ...validPayload, userId: 'admin-uid-hijack' };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden or unexpected field.*'userId'/);
    });

    it('Rejects payload with injected "isAdmin" field', () => {
      const tampered = { ...validPayload, isAdmin: true };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden or unexpected field.*'isAdmin'/);
    });

    it('Rejects payload with injected "role" field', () => {
      const tampered = { ...validPayload, role: 'admin_owner' };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden or unexpected field.*'role'/);
    });

    it('Rejects payload with injected "__proto__" field', () => {
      // Prototype pollution attempt
      const tampered = { ...validPayload, __proto__: { isAdmin: true } };
      // __proto__ is special in JS; use Object.create to force the key
      const withProto = Object.create(null);
      Object.assign(withProto, validPayload);
      withProto['__proto__'] = { isAdmin: true };
      expect(() => validateCreateOrderPayload(withProto))
        .toThrow(/Forbidden or unexpected field/);
    });

    it('Rejects payload with injected "constructor" field', () => {
      const tampered = Object.create(null);
      Object.assign(tampered, validPayload);
      tampered['constructor'] = { prototype: { isAdmin: true } };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden or unexpected field.*'constructor'/);
    });
  });

  // ============================================================================
  // 2. FORBIDDEN ITEM-LEVEL FIELD INJECTION
  // ============================================================================
  describe('2. Forbidden Item-Level Field Injection', () => {

    it('Rejects item with injected "price" field', () => {
      const tampered = {
        ...validPayload,
        items: [{ productId: 'prod_aam_achar', variantId: 'var_500g', qty: 1, price: 1 }]
      };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(ValidationError);
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden field in item object.*'price'/);
    });

    it('Rejects item with injected "lineTotal" field', () => {
      const tampered = {
        ...validPayload,
        items: [{ productId: 'prod_aam_achar', variantId: 'var_500g', qty: 1, lineTotal: 0 }]
      };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden field in item object.*'lineTotal'/);
    });

    it('Rejects item with injected "unitPrice" field', () => {
      const tampered = {
        ...validPayload,
        items: [{ productId: 'prod_aam_achar', variantId: 'var_500g', qty: 1, unitPrice: 0.01 }]
      };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden field in item object.*'unitPrice'/);
    });

    it('Rejects item with injected "stock" field', () => {
      const tampered = {
        ...validPayload,
        items: [{ productId: 'prod_aam_achar', variantId: 'var_500g', qty: 1, stock: 9999 }]
      };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden field in item object.*'stock'/);
    });

    it('Rejects item with injected "name" field inside item object', () => {
      const tampered = {
        ...validPayload,
        items: [{ productId: 'prod_aam_achar', variantId: 'var_500g', qty: 1, name: 'Hacked' }]
      };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/Forbidden field in item object.*'name'/);
    });
  });

  // ============================================================================
  // 3. QUANTITY BOUNDARY VALIDATION
  // ============================================================================
  describe('3. Quantity Boundary Validation', () => {

    it('Rejects qty: 0 (below minimum)', () => {
      const tampered = {
        ...validPayload,
        items: [{ productId: 'prod_aam_achar', variantId: 'var_500g', qty: 0 }]
      };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(ValidationError);
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/quantity must be an integer between 1 and 10/i);
    });

    it('Rejects qty: -1 (negative)', () => {
      const tampered = {
        ...validPayload,
        items: [{ productId: 'prod_aam_achar', variantId: 'var_500g', qty: -1 }]
      };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/quantity must be an integer between 1 and 10/i);
    });

    it('Rejects qty: -9999 (extreme negative)', () => {
      const tampered = {
        ...validPayload,
        items: [{ productId: 'prod_aam_achar', variantId: 'var_500g', qty: -9999 }]
      };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/quantity must be an integer between 1 and 10/i);
    });

    it('Rejects qty: 11 (above maximum)', () => {
      const tampered = {
        ...validPayload,
        items: [{ productId: 'prod_aam_achar', variantId: 'var_500g', qty: 11 }]
      };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/quantity must be an integer between 1 and 10/i);
    });

    it('Rejects qty: 999999 (extreme positive)', () => {
      const tampered = {
        ...validPayload,
        items: [{ productId: 'prod_aam_achar', variantId: 'var_500g', qty: 999999 }]
      };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/quantity must be an integer between 1 and 10/i);
    });

    it('Rejects qty: 1.5 (non-integer)', () => {
      const tampered = {
        ...validPayload,
        items: [{ productId: 'prod_aam_achar', variantId: 'var_500g', qty: 1.5 }]
      };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/quantity must be an integer between 1 and 10/i);
    });

    it('Rejects qty: "2" (string type)', () => {
      const tampered = {
        ...validPayload,
        items: [{ productId: 'prod_aam_achar', variantId: 'var_500g', qty: '2' as any }]
      };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/quantity must be an integer between 1 and 10/i);
    });

    it('Accepts qty: 1 (minimum valid)', () => {
      const valid = {
        ...validPayload,
        items: [{ productId: 'prod_aam_achar', variantId: 'var_500g', qty: 1 }]
      };
      const result = validateCreateOrderPayload(valid);
      expect(result.items[0].qty).toBe(1);
    });

    it('Accepts qty: 10 (maximum valid)', () => {
      const valid = {
        ...validPayload,
        items: [{ productId: 'prod_aam_achar', variantId: 'var_500g', qty: 10 }]
      };
      const result = validateCreateOrderPayload(valid);
      expect(result.items[0].qty).toBe(10);
    });
  });

  // ============================================================================
  // 4. STRUCTURAL PAYLOAD ATTACKS
  // ============================================================================
  describe('4. Structural Payload Attacks', () => {

    it('Rejects null payload', () => {
      expect(() => validateCreateOrderPayload(null))
        .toThrow(ValidationError);
    });

    it('Rejects string payload', () => {
      expect(() => validateCreateOrderPayload('{"name":"hack"}'))
        .toThrow(ValidationError);
    });

    it('Rejects array payload', () => {
      expect(() => validateCreateOrderPayload([validPayload]))
        .toThrow(ValidationError);
    });

    it('Rejects empty object payload', () => {
      expect(() => validateCreateOrderPayload({}))
        .toThrow(ValidationError);
    });

    it('Rejects payload with empty items array', () => {
      const tampered = { ...validPayload, items: [] };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/must contain between 1 and 20 items/i);
    });

    it('Rejects payload with 21 items (above maximum)', () => {
      const tampered = {
        ...validPayload,
        items: Array.from({ length: 21 }, (_, i) => ({
          productId: `prod_item_${i}`,
          variantId: `var_${i}`,
          qty: 1
        }))
      };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/must contain between 1 and 20 items/i);
    });

    it('Rejects item with empty productId', () => {
      const tampered = {
        ...validPayload,
        items: [{ productId: '', variantId: 'var_500g', qty: 1 }]
      };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/valid productId/i);
    });

    it('Rejects idempotencyKey shorter than 8 characters', () => {
      const tampered = { ...validPayload, idempotencyKey: 'short' };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/idempotencyKey required.*8-64/i);
    });

    it('Rejects idempotencyKey longer than 64 characters', () => {
      const tampered = { ...validPayload, idempotencyKey: 'x'.repeat(65) };
      expect(() => validateCreateOrderPayload(tampered))
        .toThrow(/idempotencyKey required.*8-64/i);
    });
  });

  // ============================================================================
  // 5. VALID PAYLOAD ACCEPTANCE (Sanity checks)
  // ============================================================================
  describe('5. Valid Payload Acceptance', () => {

    it('Accepts a well-formed minimal payload', () => {
      const result = validateCreateOrderPayload(validPayload);
      expect(result.name).toBe('Test Customer');
      expect(result.phone).toBe('9876543210');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('prod_aam_achar');
      expect(result.items[0].variantId).toBe('var_500g');
      expect(result.items[0].qty).toBe(2);
      // Confirm: result does NOT contain any price/total fields
      expect(result).not.toHaveProperty('price');
      expect(result).not.toHaveProperty('total');
      expect(result).not.toHaveProperty('subtotal');
      expect(result).not.toHaveProperty('shippingFee');
      expect(result).not.toHaveProperty('discount');
    });

    it('Strips item objects down to productId, qty, and variantId only', () => {
      const result = validateCreateOrderPayload(validPayload);
      const itemKeys = Object.keys(result.items[0]);
      expect(itemKeys.sort()).toEqual(['productId', 'qty', 'variantId']);
    });

    it('Preserves all allowed optional fields', () => {
      const result = validateCreateOrderPayload(validPayload);
      expect(result.email).toBe('test@example.com');
      expect(result.house).toBe('Flat 101');
      expect(result.street).toBe('Main Road');
      expect(result.city).toBe('Varanasi');
      expect(result.state).toBe('Uttar Pradesh');
      expect(result.pincode).toBe('221001');
    });

    it('Defaults paymentMethod to WhatsApp-Assisted Ordering when not provided', () => {
      const { paymentMethod, ...withoutMethod } = validPayload;
      const result = validateCreateOrderPayload({ ...withoutMethod, paymentMethod: undefined });
      expect(result.paymentMethod).toBe('WhatsApp-Assisted Ordering');
    });
  });
});
