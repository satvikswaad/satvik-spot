import * as crypto from 'crypto';
import { db, admin } from '../config/firebase';
import { CreateOrderPayload } from '../validation/orderSchema';
import { getAuthoritativeProductInTransaction } from '../products/productService';
import { generateGuestAccessSecret } from '../guest/guestService';
import { OutOfStockError, AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

export interface ProcessOrderParams {
  payload: CreateOrderPayload;
  userId?: string;
}

export interface OrderCreationResult {
  orderId: string;
  total: number;
  subtotal: number;
  shippingFee: number;
  status: string;
  paymentStatus: string;
  guestAccessSecret?: string;
  createdAt: string;
}

/**
 * Computes a deterministic SHA-256 hash of the order request payload.
 */
function computePayloadHash(payload: CreateOrderPayload): string {
  const canonicalString = JSON.stringify({
    name: payload.name,
    phone: payload.phone,
    address: payload.address,
    paymentMethod: payload.paymentMethod,
    items: payload.items.map(i => ({ productId: i.productId, qty: i.qty })).sort((a, b) => a.productId.localeCompare(b.productId))
  });
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

export async function processAuthoritativeOrder(params: ProcessOrderParams): Promise<OrderCreationResult> {
  const { payload, userId } = params;
  const action = 'api/v1/orders/create';
  const ownerId = userId || `GUEST_${payload.phone}`;
  const requestHash = computePayloadHash(payload);

  return db.runTransaction(async (transaction) => {
    // 1. Idempotency Binding Check
    const idempotencyRef = db.collection('idempotency').doc(payload.idempotencyKey);
    const idempotencySnap = await transaction.get(idempotencyRef);

    if (idempotencySnap.exists) {
      const cached = idempotencySnap.data()!;

      // Validate bound properties: ownerId, action, and requestHash
      if (cached.ownerId !== ownerId || cached.action !== action || cached.requestHash !== requestHash) {
        logger.warn('Idempotency key collision detected with different request payload or identity', {
          idempotencyKey: payload.idempotencyKey,
          expectedHash: cached.requestHash,
          actualHash: requestHash
        });
        throw new AppError('Idempotency key reused with a different order payload or identity', 409, 'IDEMPOTENCY_CONFLICT');
      }

      logger.info('Idempotency key match: returning cached order result', { idempotencyKey: payload.idempotencyKey });
      return cached.result as OrderCreationResult;
    }

    // 2. Fetch Authoritative Products & Validate Stock
    let subtotal = 0;
    const verifiedOrderItems: Array<{
      productId: string;
      name: string;
      qty: number;
      unitPrice: number;
      lineTotal: number;
    }> = [];

    const productUpdates: Array<{ docRef: admin.firestore.DocumentReference; newStock: number }> = [];

    for (const itemInput of payload.items) {
      const product = await getAuthoritativeProductInTransaction(transaction, itemInput.productId);

      if (product.stock < itemInput.qty) {
        throw new OutOfStockError(
          `Insufficient stock for '${product.name}'. Requested: ${itemInput.qty}, Available: ${product.stock}`
        );
      }

      const lineTotal = product.price * itemInput.qty;
      subtotal += lineTotal;

      verifiedOrderItems.push({
        productId: product.id,
        name: product.name,
        qty: itemInput.qty,
        unitPrice: product.price,
        lineTotal
      });

      const productRef = db.collection('products').doc(product.id);
      productUpdates.push({
        docRef: productRef,
        newStock: product.stock - itemInput.qty
      });
    }

    // 3. Authoritative Price Calculations (Server Set)
    const shippingFee = subtotal >= 500 ? 0 : 50; // Free shipping above ₹500
    const total = subtotal + shippingFee;

    // 4. Guest Secret Generation if Guest Checkout
    let guestSecretDetails;
    if (!userId) {
      guestSecretDetails = generateGuestAccessSecret();
    }

    // 5. Order Document Construction
    const newOrderRef = db.collection('orders').doc();
    const orderId = newOrderRef.id;

    const initialPaymentStatus = payload.paymentMethod === 'Cash on Delivery' ? 'COD_Pending' : 'Unpaid';
    const initialOrderStatus = 'Pending';

    const orderDocData: Record<string, any> = {
      orderId,
      userId: userId || null,
      name: payload.name,
      phone: payload.phone,
      address: payload.address,
      items: verifiedOrderItems,
      subtotal,
      shippingFee,
      total,
      paymentMethod: payload.paymentMethod,
      paymentStatus: initialPaymentStatus,
      status: initialOrderStatus,
      guestSecretHash: guestSecretDetails ? guestSecretDetails.hashedSecret : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 6. Write Order Document & Deduct Inventory in Transaction
    transaction.set(newOrderRef, orderDocData);

    for (const update of productUpdates) {
      transaction.update(update.docRef, { stock: update.newStock });
    }

    // 7. Store Idempotency Record Bound to ownerId, action, and requestHash
    const resultPayload: OrderCreationResult = {
      orderId,
      total,
      subtotal,
      shippingFee,
      status: initialOrderStatus,
      paymentStatus: initialPaymentStatus,
      ...(guestSecretDetails ? { guestAccessSecret: guestSecretDetails.plainSecret } : {}),
      createdAt: new Date().toISOString()
    };

    transaction.set(idempotencyRef, {
      ownerId,
      action,
      requestHash,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      result: resultPayload
    });

    logger.info('Authoritative order processed successfully', {
      orderId,
      userId: userId || 'GUEST',
      total
    });

    return resultPayload;
  });
}
