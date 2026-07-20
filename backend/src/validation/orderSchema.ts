import { ValidationError } from '../errors/AppError';

export interface OrderItemInput {
  productId: string;
  qty: number;
}

export interface CreateOrderPayload {
  name: string;
  phone: string;
  address: string;
  paymentMethod: 'Cash on Delivery' | 'UPI / GPay / PhonePe' | 'Bank Transfer';
  items: OrderItemInput[];
  idempotencyKey: string;
}

const ALLOWED_PAYMENT_METHODS = ['Cash on Delivery', 'UPI / GPay / PhonePe', 'Bank Transfer'];
const ALLOWED_TOP_LEVEL_KEYS = new Set(['name', 'phone', 'address', 'paymentMethod', 'items', 'idempotencyKey']);

export function validateCreateOrderPayload(body: any): CreateOrderPayload {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Invalid request payload format');
  }

  // Reject unknown top-level fields (e.g. price, total, status, paymentStatus, userId)
  const keys = Object.keys(body);
  for (const k of keys) {
    if (!ALLOWED_TOP_LEVEL_KEYS.has(k)) {
      throw new ValidationError(`Forbidden or unexpected field in request: '${k}'`);
    }
  }

  const { name, phone, address, paymentMethod, items, idempotencyKey } = body;

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    throw new ValidationError('Name must be between 2 and 100 characters');
  }

  const phoneDigits = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    throw new ValidationError('Phone number must contain between 10 and 15 digits');
  }

  if (typeof address !== 'string' || address.trim().length < 5 || address.trim().length > 300) {
    throw new ValidationError('Delivery address must be between 5 and 300 characters');
  }

  if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
    throw new ValidationError('Invalid payment method selected');
  }

  if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length < 8 || idempotencyKey.trim().length > 64) {
    throw new ValidationError('Valid idempotencyKey required (8-64 characters)');
  }

  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    throw new ValidationError('Order must contain between 1 and 20 items');
  }

  const validatedItems: OrderItemInput[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') {
      throw new ValidationError('Invalid item object in order list');
    }
    const itemKeys = Object.keys(item);
    for (const ik of itemKeys) {
      if (ik !== 'productId' && ik !== 'qty') {
        throw new ValidationError(`Forbidden field in item object: '${ik}'`);
      }
    }

    if (typeof item.productId !== 'string' || item.productId.trim().length === 0) {
      throw new ValidationError('Each item must specify a valid productId');
    }

    if (typeof item.qty !== 'number' || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 10) {
      throw new ValidationError('Item quantity must be an integer between 1 and 10');
    }

    validatedItems.push({
      productId: item.productId.trim(),
      qty: item.qty
    });
  }

  return {
    name: name.trim(),
    phone: phoneDigits,
    address: address.trim(),
    paymentMethod,
    idempotencyKey: idempotencyKey.trim(),
    items: validatedItems
  };
}
