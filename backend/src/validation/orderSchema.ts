import { ValidationError } from '../errors/AppError';

export interface OrderItemInput {
  productId: string;
  qty: number;
  variantId?: string;
}

export interface CreateOrderPayload {
  name: string;
  phone: string;
  address: string;
  email?: string;
  house?: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  note?: string;
  paymentMethod: string;
  items: OrderItemInput[];
  idempotencyKey: string;
}

const ALLOWED_PAYMENT_METHODS = ['WhatsApp-Assisted Ordering', 'Cash on Delivery', 'UPI', 'Online Payment'];
const ALLOWED_TOP_LEVEL_KEYS = new Set([
  'name',
  'phone',
  'address',
  'email',
  'house',
  'street',
  'landmark',
  'city',
  'state',
  'pincode',
  'note',
  'paymentMethod',
  'items',
  'idempotencyKey'
]);

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

  const { name, phone, address, email, house, street, landmark, city, state, pincode, note, paymentMethod, items, idempotencyKey } = body;

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    throw new ValidationError('Name must be between 2 and 100 characters');
  }

  const phoneDigits = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    throw new ValidationError('Phone number must contain between 10 and 15 digits');
  }

  if (typeof address !== 'string' || address.trim().length < 2 || address.trim().length > 300) {
    throw new ValidationError('Delivery address must be provided');
  }

  if (paymentMethod && typeof paymentMethod !== 'string') {
    throw new ValidationError('Invalid payment method string');
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
      if (ik !== 'productId' && ik !== 'qty' && ik !== 'variantId') {
        throw new ValidationError(`Forbidden field in item object: '${ik}'`);
      }
    }

    if (typeof item.productId !== 'string' || item.productId.trim().length === 0) {
      throw new ValidationError('Each item must specify a valid productId');
    }

    if (typeof item.qty !== 'number' || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 10) {
      throw new ValidationError('Item quantity must be an integer between 1 and 10');
    }

    let variantId: string | undefined = undefined;
    if (item.variantId !== undefined && item.variantId !== null) {
      if (typeof item.variantId !== 'string' || item.variantId.trim().length === 0 || item.variantId.trim().length > 64 || !/^[a-zA-Z0-9_-]+$/.test(item.variantId.trim())) {
        throw new ValidationError("Invalid 'variantId' format");
      }
      variantId = item.variantId.trim();
    }

    validatedItems.push({
      productId: item.productId.trim(),
      qty: item.qty,
      ...(variantId ? { variantId } : {})
    });
  }

  return {
    name: name.trim(),
    phone: phoneDigits,
    address: address.trim(),
    ...(email ? { email: String(email).trim() } : {}),
    ...(house ? { house: String(house).trim() } : {}),
    ...(street ? { street: String(street).trim() } : {}),
    ...(landmark ? { landmark: String(landmark).trim() } : {}),
    ...(city ? { city: String(city).trim() } : {}),
    ...(state ? { state: String(state).trim() } : {}),
    ...(pincode ? { pincode: String(pincode).trim() } : {}),
    ...(note ? { note: String(note).trim() } : {}),
    paymentMethod: paymentMethod ? String(paymentMethod).trim() : 'WhatsApp-Assisted Ordering',
    idempotencyKey: idempotencyKey.trim(),
    items: validatedItems
  };
}

const ALLOWED_SUBMIT_UTR_KEYS = new Set(['orderId', 'utr', 'guestAccessSecret']);

export interface SubmitUtrPayload {
  orderId: string;
  utr: string;
  guestAccessSecret?: string;
}

/**
 * Validates payload for submitting a payment UTR reference.
 * Strictly disallows unexpected/unknown keys.
 */
export function validateSubmitUtrPayload(body: any): SubmitUtrPayload {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Invalid request payload format');
  }

  const keys = Object.keys(body);
  for (const k of keys) {
    if (!ALLOWED_SUBMIT_UTR_KEYS.has(k)) {
      throw new ValidationError(`Forbidden or unexpected field in request: '${k}'`);
    }
  }

  const { orderId, utr, guestAccessSecret } = body;

  if (typeof orderId !== 'string' || !orderId.trim()) {
    throw new ValidationError('orderId is required');
  }

  if (typeof utr !== 'string' || !utr.trim()) {
    throw new ValidationError('utr is required');
  }

  if (guestAccessSecret !== undefined && guestAccessSecret !== null) {
    if (typeof guestAccessSecret !== 'string' || !guestAccessSecret.trim()) {
      throw new ValidationError('guestAccessSecret must be a valid non-empty string');
    }
  }

  return {
    orderId: orderId.trim(),
    utr: utr.trim(),
    ...(guestAccessSecret ? { guestAccessSecret: guestAccessSecret.trim() } : {})
  };
}

const ALLOWED_GUEST_LOOKUP_KEYS = new Set(['orderId', 'guestAccessSecret']);

export interface GuestLookupPayload {
  orderId: string;
  guestAccessSecret: string;
}

/**
 * Validates payload for guest order status lookup.
 * Strictly disallows unexpected/unknown keys.
 */
export function validateGuestLookupPayload(body: any): GuestLookupPayload {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Invalid request payload format');
  }

  const keys = Object.keys(body);
  for (const k of keys) {
    if (!ALLOWED_GUEST_LOOKUP_KEYS.has(k)) {
      throw new ValidationError(`Forbidden or unexpected field in request: '${k}'`);
    }
  }

  const { orderId, guestAccessSecret } = body;

  if (typeof orderId !== 'string' || !orderId.trim() || typeof guestAccessSecret !== 'string' || !guestAccessSecret.trim()) {
    throw new ValidationError('Both orderId and guestAccessSecret are required for guest lookup');
  }

  return {
    orderId: orderId.trim(),
    guestAccessSecret: guestAccessSecret.trim()
  };
}
