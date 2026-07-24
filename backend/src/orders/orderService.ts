import * as crypto from 'crypto';
import { db, admin } from '../config/firebase';
import { CreateOrderPayload } from '../validation/orderSchema';
import { getAuthoritativeProductInTransaction } from '../products/productService';
import { generateGuestAccessSecret, hashGuestSecret } from '../guest/guestService';
import { OutOfStockError, AppError, ValidationError, AuthorizationError } from '../errors/AppError';
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
    items: payload.items.map(i => ({ productId: i.productId, variantId: i.variantId || '', qty: i.qty })).sort((a, b) => (a.productId + a.variantId).localeCompare(b.productId + b.variantId))
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
      variantId?: string;
      name: string;
      qty: number;
      unitPrice: number;
      lineTotal: number;
    }> = [];

    const productUpdates: Array<{ docRef: admin.firestore.DocumentReference; newStock: number }> = [];

    for (const itemInput of payload.items) {
      const product = await getAuthoritativeProductInTransaction(transaction, itemInput.productId, itemInput.variantId);

      if (product.stock < itemInput.qty) {
        throw new OutOfStockError(
          `Insufficient stock for '${product.name}'. Requested: ${itemInput.qty}, Available: ${product.stock}`
        );
      }

      const lineTotal = product.price * itemInput.qty;
      subtotal += lineTotal;

      const itemName = product.selectedVariant
        ? `${product.name} (${product.selectedVariant.label})`
        : product.name;

      verifiedOrderItems.push({
        productId: product.id,
        ...(itemInput.variantId ? { variantId: itemInput.variantId } : {}),
        name: itemName,
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

    const initialPaymentStatus = 'Unpaid';
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

export function generateWhatsAppPrefilledMessage(params: {
  publicOrderId: string;
  items: Array<{ name: string; qty: number; unitPrice: number; lineTotal: number }>;
  subtotal: number;
  shippingFee: number;
  total: number;
  customerName: string;
  phone: string;
  pincode?: string;
}): string {
  const publicId = `#${params.publicOrderId.slice(-6).toUpperCase()}`;
  const itemLines = params.items.map(i => `• ${i.name} (x${i.qty}) - ₹${i.lineTotal}`).join('\n');
  const deliveryStr = params.shippingFee === 0 ? 'FREE (Promo)' : `₹${params.shippingFee}`;

  const phoneDigits = params.phone.replace(/\D/g, '');
  const maskedMobile = phoneDigits.length >= 10
    ? `+91 ${phoneDigits.slice(-10, -4)}****${phoneDigits.slice(-4)}`
    : params.phone;

  const pincodeStr = params.pincode ? params.pincode : 'N/A';

  return `Namaste Satvik Swaad,

I want to continue with my order request.

Order ID: ${publicId}

Items:
${itemLines}

Subtotal: ₹${params.subtotal}
Delivery: ${deliveryStr}
Final Amount: ₹${params.total}

Customer: ${params.customerName}
Mobile: ${maskedMobile}
PIN Code: ${pincodeStr}

Please verify this Order ID and send the official payment QR.

Security: I will never share my UPI PIN, OTP, CVV or banking password.`;
}

export interface WhatsAppOrderResult extends OrderCreationResult {
  whatsappUrl: string;
  whatsappMessage: string;
}

export async function processWhatsAppOrderRequest(params: ProcessOrderParams): Promise<WhatsAppOrderResult> {
  const { payload, userId } = params;
  const action = 'api/v1/orders/create-whatsapp-request';
  const ownerId = userId || `GUEST_${payload.phone}`;
  const requestHash = computePayloadHash(payload);

  return db.runTransaction(async (transaction) => {
    // 1. Idempotency Check
    const idempotencyRef = db.collection('idempotency').doc(payload.idempotencyKey);
    const idempotencySnap = await transaction.get(idempotencyRef);

    if (idempotencySnap.exists) {
      const cached = idempotencySnap.data()!;
      if (cached.ownerId !== ownerId || cached.action !== action || cached.requestHash !== requestHash) {
        logger.warn('Idempotency collision on WhatsApp order request', { idempotencyKey: payload.idempotencyKey });
        throw new AppError('Idempotency key reused with a different order payload or identity', 409, 'IDEMPOTENCY_CONFLICT');
      }
      logger.info('Idempotency match: returning cached WhatsApp order result', { idempotencyKey: payload.idempotencyKey });
      return cached.result as WhatsAppOrderResult;
    }

    // 2. Fetch Authoritative Products & Validate Stock
    let subtotal = 0;
    const verifiedOrderItems: Array<{
      productId: string;
      variantId?: string;
      name: string;
      qty: number;
      unitPrice: number;
      lineTotal: number;
    }> = [];

    for (const itemInput of payload.items) {
      const product = await getAuthoritativeProductInTransaction(transaction, itemInput.productId, itemInput.variantId);

      if (product.stock < itemInput.qty) {
        throw new OutOfStockError(
          `Insufficient stock for '${product.name}'. Requested: ${itemInput.qty}, Available: ${product.stock}`
        );
      }

      const lineTotal = product.price * itemInput.qty;
      subtotal += lineTotal;

      const itemName = product.selectedVariant
        ? `${product.name} (${product.selectedVariant.label})`
        : product.name;

      verifiedOrderItems.push({
        productId: product.id,
        ...(itemInput.variantId ? { variantId: itemInput.variantId } : {}),
        name: itemName,
        qty: itemInput.qty,
        unitPrice: product.price,
        lineTotal
      });
    }

    // 3. Authoritative Pricing
    const shippingFee = subtotal >= 500 ? 0 : 50;
    const total = subtotal + shippingFee;

    // 4. Guest Secret
    let guestSecretDetails;
    if (!userId) {
      guestSecretDetails = generateGuestAccessSecret();
    }

    // 5. Construct Order Document
    const newOrderRef = db.collection('orders').doc();
    const orderId = newOrderRef.id;

    const initialPaymentStatus = 'PAYMENT_PENDING';
    const initialOrderStatus = 'AWAITING_PAYMENT';

    const orderDocData: Record<string, any> = {
      orderId,
      userId: userId || null,
      name: payload.name,
      phone: payload.phone,
      address: payload.address,
      pincode: payload.pincode || null,
      items: verifiedOrderItems,
      subtotal,
      shippingFee,
      total,
      paymentMethod: 'WhatsApp-Assisted Ordering',
      paymentStatus: initialPaymentStatus,
      status: initialOrderStatus,
      guestSecretHash: guestSecretDetails ? guestSecretDetails.hashedSecret : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Write Order Document
    transaction.set(newOrderRef, orderDocData);

    // Build WhatsApp Prefilled Message & URL
    const whatsappMessage = generateWhatsAppPrefilledMessage({
      publicOrderId: orderId,
      items: verifiedOrderItems,
      subtotal,
      shippingFee,
      total,
      customerName: payload.name,
      phone: payload.phone,
      pincode: payload.pincode
    });

    const encodedMsg = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/919236587600?text=${encodedMsg}`;

    const resultPayload: WhatsAppOrderResult = {
      orderId,
      total,
      subtotal,
      shippingFee,
      status: initialOrderStatus,
      paymentStatus: initialPaymentStatus,
      whatsappUrl,
      whatsappMessage,
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

    logger.info('WhatsApp order request created successfully', {
      orderId,
      userId: userId || 'GUEST',
      total
    });

    return resultPayload;
  });
}

export async function submitUtrForOrder(orderId: string, utr: string, guestSecret?: string): Promise<{ success: boolean; message: string; paymentStatus: string }> {
  if (!utr || typeof utr !== 'string' || !/^[a-zA-Z0-9]{6,30}$/.test(utr.trim())) {
    throw new ValidationError('Invalid UTR / Reference format. Must be 6-30 alphanumeric characters.');
  }

  const cleanUtr = utr.trim().toUpperCase();
  const orderRef = db.collection('orders').doc(orderId);

  return db.runTransaction(async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    const orderData = orderSnap.data()!;

    // Validate guest secret if present
    if (orderData.guestSecretHash && guestSecret) {
      const hashed = hashGuestSecret(guestSecret);
      if (hashed !== orderData.guestSecretHash) {
        throw new AuthorizationError('Invalid guest access secret for order tracking');
      }
    }

    // Check UTR uniqueness across all orders
    const utrQuery = await db.collection('orders').where('utr', '==', cleanUtr).limit(1).get();
    if (!utrQuery.empty && utrQuery.docs[0].id !== orderId) {
      throw new AppError('This UTR / Payment Reference has already been submitted for another order.', 409, 'DUPLICATE_UTR');
    }

    transaction.update(orderRef, {
      utr: cleanUtr,
      paymentStatus: 'PAYMENT_UNDER_REVIEW',
      utrSubmittedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const eventRef = orderRef.collection('events').doc();
    transaction.set(eventRef, {
      action: 'UTR_SUBMITTED',
      utr: cleanUtr,
      previousPaymentStatus: orderData.paymentStatus || 'PAYMENT_PENDING',
      newPaymentStatus: 'PAYMENT_UNDER_REVIEW',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: 'UTR submitted successfully. Payment is under review.',
      paymentStatus: 'PAYMENT_UNDER_REVIEW'
    };
  });
}

