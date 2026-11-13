import * as crypto from 'crypto';
import { db, admin } from '../config/firebase';
import { CreateOrderPayload } from '../validation/orderSchema';
import { getAuthoritativeProductInTransaction } from '../products/productService';
import { generateGuestAccessSecret, hashGuestSecret } from '../guest/guestService';
import { OutOfStockError, AppError, ValidationError, AuthorizationError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { logInventoryChangeInTransaction } from '../inventory/inventoryService';
import { priceOrder, OrderLineInput, DiscountDoc, DeliveryZoneConfig } from '../pricing/pricingEngine';
import { generateOrderId } from '../shared';
import { validateAndRedeemCouponInTransaction } from '../coupons/couponService';
import { recordSaleInDailyStatsInTransaction } from '../db/statsDailyService';

export interface ProcessOrderParams {
  payload: CreateOrderPayload;
  userId?: string;
}

export interface OrderCreationResult {
  orderId: string;
  totalPaise: number;
  subtotalPaise: number;
  deliveryFeePaise: number;
  taxPaise: number;
  discountPaise: number;
  total: number;
  subtotal: number;
  shippingFee: number;
  status: string;
  orderStatus: string;
  paymentStatus: string;
  needsReview?: boolean;
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
    items: payload.items
      .map(orderItem => ({ productId: orderItem.productId, variantId: orderItem.variantId || '', qty: orderItem.qty }))
      .sort((itemA, itemB) => (itemA.productId + itemA.variantId).localeCompare(itemB.productId + itemB.variantId))
  });
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

export async function processAuthoritativeOrder(params: ProcessOrderParams): Promise<OrderCreationResult> {
  const { payload, userId } = params;
  const action = 'api/v1/orders/create';
  const ownerId = userId || `GUEST_${payload.phone}`;
  const requestHash = computePayloadHash(payload);

  return db.runTransaction(async (transaction) => {
    // 1. Idempotency Binding Check (Collection: idempotencyKeys per Decision D13)
    let idempotencyRef = db.collection('idempotencyKeys').doc(payload.idempotencyKey);
    let idempotencySnap = await transaction.get(idempotencyRef);

    if (!idempotencySnap.exists) {
      const legacyRef = db.collection('idempotency').doc(payload.idempotencyKey);
      const legacySnap = await transaction.get(legacyRef);
      if (legacySnap.exists) {
        idempotencyRef = legacyRef;
        idempotencySnap = legacySnap;
      }
    }

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

    // 2. Fetch Authoritative Products & Validate Stock (PRICE-1, STOCK-1)
    const orderLineInputs: OrderLineInput[] = [];
    const verifiedOrderItems: Array<{
      productId: string;
      variantId?: string;
      name: string;
      qty: number;
      unitPrice: number;
      unitPricePaise: number;
      lineTotal: number;
      lineTotalPaise: number;
    }> = [];

    const productUpdates: Array<{
      docRef: admin.firestore.DocumentReference;
      productId: string;
      variantId?: string;
      previousStock: number;
      newStock: number;
      qty: number;
    }> = [];

    for (const itemInput of payload.items) {
      const product = await getAuthoritativeProductInTransaction(transaction, itemInput.productId, itemInput.variantId);

      if (product.stock < itemInput.qty) {
        throw new OutOfStockError(
          `Insufficient stock for '${product.name}'. Requested: ${itemInput.qty}, Available: ${product.stock}`
        );
      }

      const unitPricePaise = product.pricePaise || Math.round(product.price * 100);
      const lineTotalPaise = unitPricePaise * itemInput.qty;
      const itemName = product.selectedVariant
        ? `${product.name} (${product.selectedVariant.label})`
        : product.name;
      const variantId = itemInput.variantId || (product.selectedVariant ? product.selectedVariant.id : product.id);

      orderLineInputs.push({
        productId: product.id,
        variantId,
        title: itemName,
        unitPricePaise,
        qty: itemInput.qty,
        taxRatePercent: product.taxRatePercent || 12,
        hsn: product.hsn || '20019000'
      });

      verifiedOrderItems.push({
        productId: product.id,
        ...(variantId ? { variantId } : {}),
        name: itemName,
        qty: itemInput.qty,
        unitPrice: unitPricePaise / 100,
        unitPricePaise,
        lineTotal: lineTotalPaise / 100,
        lineTotalPaise
      });

      const productRef = db.collection('products').doc(product.id);
      productUpdates.push({
        docRef: productRef,
        productId: product.id,
        variantId: itemInput.variantId,
        previousStock: product.stock,
        newStock: product.stock - itemInput.qty,
        qty: itemInput.qty
      });
    }

    // 3. Fetch delivery zones configuration from config/deliveryZones (Decision D5, D17)
    let deliveryZones: DeliveryZoneConfig | undefined = undefined;
    try {
      const zonesSnap = await transaction.get(db.collection('config').doc('deliveryZones'));
      if (zonesSnap.exists) {
        deliveryZones = zonesSnap.data() as DeliveryZoneConfig;
      }
    } catch {
      // Fallback
    }

    // 4. Fetch discount code if provided (DISC-1, collection: discounts)
    let discountCodeDoc: DiscountDoc | null = null;
    if (payload.discountCode) {
      const codeUpper = payload.discountCode.toUpperCase();
      const discSnap = await transaction.get(db.collection('discounts').doc(codeUpper));
      if (discSnap.exists) {
        discountCodeDoc = discSnap.data() as DiscountDoc;
      }
    }

    // 5. Authoritative Pricing via priceOrder (PRICE-1 to PRICE-9, MONEY-1)
    const priced = priceOrder({
      items: orderLineInputs,
      pincode: payload.pincode || '',
      discountCodeDoc,
      deliveryZones
    });

    // 6. Generate Cryptographic Order ID (SS- + 12 Crockford base32 per Section 2.2)
    const orderId = generateOrderId();
    const newOrderRef = db.collection('orders').doc(orderId);

    // 7. Atomic Coupon Redemption in Transaction (DISC-2, DISC-3, DISC-4)
    if (payload.discountCode && priced.discountPaise > 0) {
      await validateAndRedeemCouponInTransaction(
        transaction,
        payload.discountCode,
        orderId,
        priced.subtotalPaise,
        userId,
        payload.phone
      );
    }

    // 8. Guest Secret Generation if Guest Checkout
    let guestSecretDetails;
    if (!userId) {
      guestSecretDetails = generateGuestAccessSecret();
    }

    // 9. Canonical Statuses per Section 4.5
    const isCod = payload.paymentMethod === 'Cash on Delivery' || payload.paymentMethod === 'COD';
    const initialOrderStatus = 'PLACED';
    const initialPaymentStatus = isCod ? 'COD_DUE' : 'UNPAID';

    const itemNames = priced.lines.map(item => item.title);
    const itemSummary = priced.lines.map(item => `${item.title} × ${item.qty}`).join(', ');

    const orderDocData: Record<string, any> = {
      orderId,
      userId: userId || null,
      name: payload.name,
      phone: payload.phone,
      customerName: payload.name,   // Point-in-time immutable snapshot
      customerPhone: payload.phone, // Point-in-time immutable snapshot
      itemNames,
      itemSummary,
      address: payload.address,
      pincode: payload.pincode || null,
      items: verifiedOrderItems,
      lines: priced.lines,          // Complete frozen line snapshot (PRICE-8, PRICE-9)
      subtotalPaise: priced.subtotalPaise,
      discountPaise: priced.discountPaise,
      deliveryFeePaise: priced.shippingPaise,
      taxPaise: priced.taxPaise,
      totalPaise: priced.totalPaise,
      // Float mirrors for legacy storefront backward compatibility
      subtotal: priced.subtotalPaise / 100,
      shippingFee: priced.shippingPaise / 100,
      total: priced.totalPaise / 100,
      discount: priced.discountPaise / 100,
      needsReview: priced.needsReview,
      paymentMethod: payload.paymentMethod,
      paymentStatus: initialPaymentStatus,
      status: initialOrderStatus,
      orderStatus: initialOrderStatus,
      version: 1,
      guestSecretHash: guestSecretDetails ? guestSecretDetails.hashedSecret : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: new Date().toISOString()
    };

    // 10. Write Order Document & Deduct Inventory in Transaction
    transaction.set(newOrderRef, orderDocData);

    for (const update of productUpdates) {
      transaction.update(update.docRef, { stock: update.newStock });
      logInventoryChangeInTransaction(transaction, {
        productId: update.productId,
        variantId: update.variantId,
        previousStock: update.previousStock,
        newStock: update.newStock,
        delta: -update.qty,
        reason: 'ORDER_DEDUCTION',
        orderId,
        actorUid: userId || 'GUEST'
      });
    }

    // 10b. Update stats_daily atomically in transaction (INV-5, DB-5)
    const totalUnits = priced.lines.reduce((acc, l) => acc + l.qty, 0);
    await recordSaleInDailyStatsInTransaction(transaction, {
      totalPaise: priced.totalPaise,
      channel: 'ONLINE',
      unitsCount: totalUnits
    });

    // 11. Store Idempotency Record Bound to ownerId, action, and requestHash
    const resultPayload: OrderCreationResult = {
      orderId,
      totalPaise: priced.totalPaise,
      subtotalPaise: priced.subtotalPaise,
      deliveryFeePaise: priced.shippingPaise,
      taxPaise: priced.taxPaise,
      discountPaise: priced.discountPaise,
      total: priced.totalPaise / 100,
      subtotal: priced.subtotalPaise / 100,
      shippingFee: priced.shippingPaise / 100,
      status: initialOrderStatus,
      orderStatus: initialOrderStatus,
      paymentStatus: initialPaymentStatus,
      needsReview: priced.needsReview,
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

    if (idempotencyRef.parent.id !== 'idempotencyKeys') {
      const primaryKeyRef = db.collection('idempotencyKeys').doc(payload.idempotencyKey);
      transaction.set(primaryKeyRef, {
        ownerId,
        action,
        requestHash,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        result: resultPayload
      });
    }

    logger.info('Authoritative order processed successfully', {
      orderId,
      userId: userId || 'GUEST',
      totalPaise: priced.totalPaise
    });

    return resultPayload;
  });
}

/**
 * Creates an order for online checkout flow.
 * Status starts as PLACED + UNPAID. Stock is validated.
 */
export async function processCheckoutOrder(params: ProcessOrderParams): Promise<OrderCreationResult> {
  const { payload, userId } = params;
  const action = 'api/v1/payments/create-order';
  const ownerId = userId || `GUEST_${payload.phone}`;
  const requestHash = computePayloadHash(payload);

  return db.runTransaction(async (transaction) => {
    // 1. Idempotency Binding Check (Collection: idempotencyKeys per Decision D13)
    let idempotencyRef = db.collection('idempotencyKeys').doc(payload.idempotencyKey);
    let idempotencySnap = await transaction.get(idempotencyRef);

    if (!idempotencySnap.exists) {
      const legacyRef = db.collection('idempotency').doc(payload.idempotencyKey);
      const legacySnap = await transaction.get(legacyRef);
      if (legacySnap.exists) {
        idempotencyRef = legacyRef;
        idempotencySnap = legacySnap;
      }
    }

    if (idempotencySnap.exists) {
      const cached = idempotencySnap.data()!;

      if (cached.ownerId !== ownerId || cached.action !== action || cached.requestHash !== requestHash) {
        logger.warn('Idempotency key collision in checkout order', {
          idempotencyKey: payload.idempotencyKey,
          expectedHash: cached.requestHash,
          actualHash: requestHash
        });
        throw new AppError('Idempotency key reused with a different order payload or identity', 409, 'IDEMPOTENCY_CONFLICT');
      }

      logger.info('Idempotency key match in checkout: returning cached result', { idempotencyKey: payload.idempotencyKey });
      return cached.result as OrderCreationResult;
    }

    // 2. Fetch Authoritative Products & Validate Stock (PRICE-1, STOCK-1)
    const orderLineInputs: OrderLineInput[] = [];
    const verifiedOrderItems: Array<{
      productId: string;
      variantId?: string;
      name: string;
      qty: number;
      unitPrice: number;
      unitPricePaise: number;
      lineTotal: number;
      lineTotalPaise: number;
    }> = [];

    for (const itemInput of payload.items) {
      const product = await getAuthoritativeProductInTransaction(transaction, itemInput.productId, itemInput.variantId);

      if (product.stock < itemInput.qty) {
        throw new OutOfStockError(
          `Insufficient stock for '${product.name}'. Requested: ${itemInput.qty}, Available: ${product.stock}`
        );
      }

      const unitPricePaise = product.pricePaise || Math.round(product.price * 100);
      const lineTotalPaise = unitPricePaise * itemInput.qty;
      const itemName = product.selectedVariant
        ? `${product.name} (${product.selectedVariant.label})`
        : product.name;
      const variantId = itemInput.variantId || (product.selectedVariant ? product.selectedVariant.id : product.id);

      orderLineInputs.push({
        productId: product.id,
        variantId,
        title: itemName,
        unitPricePaise,
        qty: itemInput.qty,
        taxRatePercent: product.taxRatePercent || 12,
        hsn: product.hsn || '20019000'
      });

      verifiedOrderItems.push({
        productId: product.id,
        ...(variantId ? { variantId } : {}),
        name: itemName,
        qty: itemInput.qty,
        unitPrice: unitPricePaise / 100,
        unitPricePaise,
        lineTotal: lineTotalPaise / 100,
        lineTotalPaise
      });
    }

    // 3. Fetch delivery zones configuration from config/deliveryZones
    let deliveryZones: DeliveryZoneConfig | undefined = undefined;
    try {
      const zonesSnap = await transaction.get(db.collection('config').doc('deliveryZones'));
      if (zonesSnap.exists) {
        deliveryZones = zonesSnap.data() as DeliveryZoneConfig;
      }
    } catch {
      // Fallback
    }

    // 4. Fetch discount code if provided (DISC-1, collection: discounts)
    let discountCodeDoc: DiscountDoc | null = null;
    if (payload.discountCode) {
      const codeUpper = payload.discountCode.toUpperCase();
      const discSnap = await transaction.get(db.collection('discounts').doc(codeUpper));
      if (discSnap.exists) {
        discountCodeDoc = discSnap.data() as DiscountDoc;
      }
    }

    // 5. Authoritative Pricing via priceOrder (PRICE-1..9, MONEY-1)
    const priced = priceOrder({
      items: orderLineInputs,
      pincode: payload.pincode || '',
      discountCodeDoc,
      deliveryZones
    });

    // 6. Guest Secret
    let guestSecretDetails;
    if (!userId) {
      guestSecretDetails = generateGuestAccessSecret();
    }

    // 7. Generate Cryptographic Order ID
    const orderId = generateOrderId();
    const newOrderRef = db.collection('orders').doc(orderId);

    // 8. Redeem Coupon in Transaction if present (DISC-2)
    if (payload.discountCode && priced.discountPaise > 0) {
      await validateAndRedeemCouponInTransaction(
        transaction,
        payload.discountCode,
        orderId,
        priced.subtotalPaise,
        userId,
        payload.phone
      );
    }

    const initialPaymentStatus = 'UNPAID';
    const initialOrderStatus = 'PLACED';

    const itemNames = verifiedOrderItems.map(item => item.name);
    const itemSummary = verifiedOrderItems.map(item => `${item.name} × ${item.qty}`).join(', ');

    const orderDocData: Record<string, any> = {
      orderId,
      userId: userId || null,
      name: payload.name,
      phone: payload.phone,
      customerName: payload.name,   // Point-in-time immutable snapshot
      customerPhone: payload.phone, // Point-in-time immutable snapshot
      itemNames,
      itemSummary,
      address: payload.address,
      pincode: payload.pincode || null,
      items: verifiedOrderItems,
      lines: priced.lines,          // Complete frozen line snapshot
      subtotalPaise: priced.subtotalPaise,
      discountPaise: priced.discountPaise,
      deliveryFeePaise: priced.shippingPaise,
      taxPaise: priced.taxPaise,
      totalPaise: priced.totalPaise,
      subtotal: priced.subtotalPaise / 100,
      shippingFee: priced.shippingPaise / 100,
      total: priced.totalPaise / 100,
      discount: priced.discountPaise / 100,
      needsReview: priced.needsReview,
      paymentMethod: payload.paymentMethod || 'Online Payment',
      paymentStatus: initialPaymentStatus,
      status: initialOrderStatus,
      orderStatus: initialOrderStatus,
      version: 1,
      guestSecretHash: guestSecretDetails ? guestSecretDetails.hashedSecret : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: new Date().toISOString()
    };

    transaction.set(newOrderRef, orderDocData);

    // 9. Store Idempotency Record
    const resultPayload: OrderCreationResult = {
      orderId,
      totalPaise: priced.totalPaise,
      subtotalPaise: priced.subtotalPaise,
      deliveryFeePaise: priced.shippingPaise,
      taxPaise: priced.taxPaise,
      discountPaise: priced.discountPaise,
      total: priced.totalPaise / 100,
      subtotal: priced.subtotalPaise / 100,
      shippingFee: priced.shippingPaise / 100,
      status: initialOrderStatus,
      orderStatus: initialOrderStatus,
      paymentStatus: initialPaymentStatus,
      needsReview: priced.needsReview,
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

    if (idempotencyRef.parent.id !== 'idempotencyKeys') {
      const primaryKeyRef = db.collection('idempotencyKeys').doc(payload.idempotencyKey);
      transaction.set(primaryKeyRef, {
        ownerId,
        action,
        requestHash,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        result: resultPayload
      });
    }

    logger.info('Checkout order created, awaiting payment', { orderId, userId: userId || 'GUEST', totalPaise: priced.totalPaise });

    return resultPayload;
  });
}

export function generateWhatsAppPrefilledMessage(params: {
  publicOrderId: string;
  items: Array<{ name: string; qty: number; unitPrice: number; lineTotal: number; variantLabel?: string }>;
  subtotal: number;
  shippingFee: number;
  total: number;
  customerName: string;
  phone: string;
  email?: string;
  house?: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  note?: string;
  paymentMethod?: string;
  createdAt?: string;
}): string {
  const publicId = `${params.publicOrderId.slice(-6).toUpperCase()}`;

  const now = params.createdAt ? new Date(params.createdAt) : new Date();
  const dateStr = now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const formattedItems = params.items.map((orderItem, itemIndex) => {
    let baseName = orderItem.name;
    let variantSize = orderItem.variantLabel || 'Standard';
    const match = orderItem.name.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      baseName = match[1];
      variantSize = match[2];
    }
    return `${itemIndex + 1}. ${baseName}\n   • Variant: ${variantSize}\n   • Qty: x${orderItem.qty}\n   • Price: ₹${orderItem.unitPrice}\n   • Total: ₹${orderItem.lineTotal}`;
  }).join('\n\n');

  const deliveryStr = params.shippingFee === 0 ? 'FREE 🎉' : `₹${params.shippingFee}`;
  const discountStr = '₹0';

  const phoneDigits = params.phone.replace(/\D/g, '');
  const formattedPhone = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : params.phone;

  const houseStr = params.house || params.address || 'N/A';
  const streetStr = params.street || 'N/A';
  const landmarkStr = params.landmark || 'N/A';
  const cityStr = params.city || 'N/A';
  const stateStr = params.state || 'N/A';
  const pinStr = params.pincode || 'N/A';
  const emailStr = params.email || 'N/A';
  const noteStr = params.note || 'None';
  const payMethodStr = params.paymentMethod || 'WhatsApp-Assisted Ordering';

  return `🛒 *NEW ORDER REQUEST - SATVIK SWAAD*

🙏 Namaste!

I would like to place the following order.

━━━━━━━━━━━━━━━━━━━━
📦 *ORDER DETAILS*
━━━━━━━━━━━━━━━━━━━━
🆔 Order ID: #${publicId}
📅 Order Date: ${dateStr}

🛍️ *Items Ordered*
${formattedItems}

━━━━━━━━━━━━━━━━━━━━
💰 *PAYMENT SUMMARY*
━━━━━━━━━━━━━━━━━━━━
Subtotal: ₹${params.subtotal}
Delivery Charges: ${deliveryStr}
Discount: ${discountStr}
━━━━━━━━━━━━━━━━━━━━
💳 *Grand Total: ₹${params.total}*
━━━━━━━━━━━━━━━━━━━━

👤 *CUSTOMER DETAILS*
Name: ${params.customerName}
📞 Mobile: +91 ${formattedPhone}
📧 Email: ${emailStr}

📍 *DELIVERY ADDRESS*
House/Flat: ${houseStr}
Area/Street: ${streetStr}
Landmark: ${landmarkStr}
City: ${cityStr}
State: ${stateStr}
PIN Code: ${pinStr}

📝 *SPECIAL INSTRUCTIONS*
${noteStr}

💳 *PAYMENT METHOD*
${payMethodStr}

Kindly confirm:
✅ Product availability
✅ Final payable amount
✅ Payment details (if applicable)
✅ Expected dispatch/delivery time

Thank you! 🙏`;
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
    // 1. Idempotency Check (Collection: idempotencyKeys per Decision D13)
    let idempotencyRef = db.collection('idempotencyKeys').doc(payload.idempotencyKey);
    let idempotencySnap = await transaction.get(idempotencyRef);

    if (!idempotencySnap.exists) {
      const legacyRef = db.collection('idempotency').doc(payload.idempotencyKey);
      const legacySnap = await transaction.get(legacyRef);
      if (legacySnap.exists) {
        idempotencyRef = legacyRef;
        idempotencySnap = legacySnap;
      }
    }

    if (idempotencySnap.exists) {
      const cached = idempotencySnap.data()!;
      if (cached.ownerId !== ownerId || cached.action !== action || cached.requestHash !== requestHash) {
        logger.warn('Idempotency collision on WhatsApp order request', { idempotencyKey: payload.idempotencyKey });
        throw new AppError('Idempotency key reused with a different order payload or identity', 409, 'IDEMPOTENCY_CONFLICT');
      }
      logger.info('Idempotency match: returning cached WhatsApp order result', { idempotencyKey: payload.idempotencyKey });
      return cached.result as WhatsAppOrderResult;
    }

    // 2. Fetch Authoritative Products & Validate Stock (PRICE-1, STOCK-1)
    const orderLineInputs: OrderLineInput[] = [];
    const verifiedOrderItems: Array<{
      productId: string;
      variantId?: string;
      name: string;
      qty: number;
      unitPrice: number;
      unitPricePaise: number;
      lineTotal: number;
      lineTotalPaise: number;
    }> = [];

    for (const itemInput of payload.items) {
      const product = await getAuthoritativeProductInTransaction(transaction, itemInput.productId, itemInput.variantId);

      if (product.stock < itemInput.qty) {
        throw new OutOfStockError(
          `Insufficient stock for '${product.name}'. Requested: ${itemInput.qty}, Available: ${product.stock}`
        );
      }

      const unitPricePaise = product.pricePaise || Math.round(product.price * 100);
      const lineTotalPaise = unitPricePaise * itemInput.qty;
      const itemName = product.selectedVariant
        ? `${product.name} (${product.selectedVariant.label})`
        : product.name;
      const variantId = itemInput.variantId || (product.selectedVariant ? product.selectedVariant.id : product.id);

      orderLineInputs.push({
        productId: product.id,
        variantId,
        title: itemName,
        unitPricePaise,
        qty: itemInput.qty,
        taxRatePercent: product.taxRatePercent || 12,
        hsn: product.hsn || '20019000'
      });

      verifiedOrderItems.push({
        productId: product.id,
        ...(variantId ? { variantId } : {}),
        name: itemName,
        qty: itemInput.qty,
        unitPrice: unitPricePaise / 100,
        unitPricePaise,
        lineTotal: lineTotalPaise / 100,
        lineTotalPaise
      });
    }

    // 3. Fetch delivery zones configuration
    let deliveryZones: DeliveryZoneConfig | undefined = undefined;
    try {
      const zonesSnap = await transaction.get(db.collection('config').doc('deliveryZones'));
      if (zonesSnap.exists) {
        deliveryZones = zonesSnap.data() as DeliveryZoneConfig;
      }
    } catch {
      // Fallback
    }

    // 4. Fetch discount code if provided (DISC-1, collection: discounts)
    let discountCodeDoc: DiscountDoc | null = null;
    if (payload.discountCode) {
      const codeUpper = payload.discountCode.toUpperCase();
      const discSnap = await transaction.get(db.collection('discounts').doc(codeUpper));
      if (discSnap.exists) {
        discountCodeDoc = discSnap.data() as DiscountDoc;
      }
    }

    // 5. Authoritative Pricing via priceOrder
    const priced = priceOrder({
      items: orderLineInputs,
      pincode: payload.pincode || '',
      discountCodeDoc,
      deliveryZones
    });

    // 6. Guest Secret
    let guestSecretDetails;
    if (!userId) {
      guestSecretDetails = generateGuestAccessSecret();
    }

    // 7. Generate Cryptographic Order ID
    const orderId = generateOrderId();
    const newOrderRef = db.collection('orders').doc(orderId);

    const initialPaymentStatus = 'UNPAID';
    const initialOrderStatus = 'PLACED';

    const itemNames = verifiedOrderItems.map(item => item.name);
    const itemSummary = verifiedOrderItems.map(item => `${item.name} × ${item.qty}`).join(', ');

    const orderDocData: Record<string, any> = {
      orderId,
      userId: userId || null,
      name: payload.name,
      phone: payload.phone,
      customerName: payload.name,   // Point-in-time immutable snapshot
      customerPhone: payload.phone, // Point-in-time immutable snapshot
      itemNames,
      itemSummary,
      email: payload.email || null,
      house: payload.house || null,
      street: payload.street || null,
      landmark: payload.landmark || null,
      city: payload.city || null,
      state: payload.state || null,
      address: payload.address,
      pincode: payload.pincode || null,
      note: payload.note || null,
      items: verifiedOrderItems,
      lines: priced.lines,
      subtotalPaise: priced.subtotalPaise,
      discountPaise: priced.discountPaise,
      deliveryFeePaise: priced.shippingPaise,
      taxPaise: priced.taxPaise,
      totalPaise: priced.totalPaise,
      subtotal: priced.subtotalPaise / 100,
      shippingFee: priced.shippingPaise / 100,
      total: priced.totalPaise / 100,
      discount: priced.discountPaise / 100,
      needsReview: priced.needsReview,
      paymentMethod: payload.paymentMethod || 'WhatsApp-Assisted Ordering',
      paymentStatus: initialPaymentStatus,
      status: initialOrderStatus,
      orderStatus: initialOrderStatus,
      version: 1,
      guestSecretHash: guestSecretDetails ? guestSecretDetails.hashedSecret : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: new Date().toISOString()
    };

    // Write Order Document
    transaction.set(newOrderRef, orderDocData);

    // Build WhatsApp Prefilled Message & URL
    const whatsappMessage = generateWhatsAppPrefilledMessage({
      publicOrderId: orderId,
      items: verifiedOrderItems,
      subtotal: priced.subtotalPaise / 100,
      shippingFee: priced.shippingPaise / 100,
      total: priced.totalPaise / 100,
      customerName: payload.name,
      phone: payload.phone,
      email: payload.email,
      house: payload.house,
      street: payload.street,
      landmark: payload.landmark,
      city: payload.city,
      state: payload.state,
      pincode: payload.pincode,
      address: payload.address,
      note: payload.note,
      paymentMethod: payload.paymentMethod
    });

    const encodedMsg = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/919236587600?text=${encodedMsg}`;

    const resultPayload: WhatsAppOrderResult = {
      orderId,
      totalPaise: priced.totalPaise,
      subtotalPaise: priced.subtotalPaise,
      deliveryFeePaise: priced.shippingPaise,
      taxPaise: priced.taxPaise,
      discountPaise: priced.discountPaise,
      total: priced.totalPaise / 100,
      subtotal: priced.subtotalPaise / 100,
      shippingFee: priced.shippingPaise / 100,
      status: initialOrderStatus,
      orderStatus: initialOrderStatus,
      paymentStatus: initialPaymentStatus,
      needsReview: priced.needsReview,
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

    if (idempotencyRef.parent.id !== 'idempotencyKeys') {
      const primaryKeyRef = db.collection('idempotencyKeys').doc(payload.idempotencyKey);
      transaction.set(primaryKeyRef, {
        ownerId,
        action,
        requestHash,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        result: resultPayload
      });
    }

    logger.info('WhatsApp order request created successfully', {
      orderId,
      userId: userId || 'GUEST',
      totalPaise: priced.totalPaise
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

    // Validate guest secret if present (AUTH-2, AUTH-3)
    const storedSecretHash = orderData.guestSecretHash || orderData.guestTokenHash;
    if (storedSecretHash) {
      if (!guestSecret || typeof guestSecret !== 'string') {
        throw new AppError('Order not found', 404, 'NOT_FOUND');
      }
      const hashed = hashGuestSecret(guestSecret.trim());
      const bufProvided = Buffer.from(hashed, 'utf8');
      const bufStored = Buffer.from(storedSecretHash, 'utf8');
      const isValid = bufProvided.length === bufStored.length && crypto.timingSafeEqual(bufProvided, bufStored);
      if (!isValid) {
        throw new AppError('Order not found', 404, 'NOT_FOUND');
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

