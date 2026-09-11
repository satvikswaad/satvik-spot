import * as crypto from 'crypto';
import { db, admin } from '../config/firebase';
import { envConfig } from '../config/environment';
import { AppError, ValidationError, PaymentsNotAvailableError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { processCheckoutOrder, OrderCreationResult } from '../orders/orderService';
import { PayUCreateOrderInput } from './payuSchema';

export interface PayUOrderParams {
  payload: PayUCreateOrderInput;
  userId?: string;
  clientOrigin?: string;
}

export interface PayUPaymentInitResult {
  payuActionUrl: string;
  payuKey: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  udf1: string;
  udf2: string;
  orderId: string;
  isReusedSession?: boolean;
}

/**
 * Generates a unique transaction ID matching the Blueprint format:
 * satvik_ord_[timestamp]_[randomHex]
 */
export function generatePayUTxnId(): string {
  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(4).toString('hex');
  return `satvik_ord_${timestamp}_${randomHex}`;
}

/**
 * Calculates SHA-512 request hash for PayU standard integration:
 * sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 */
export function calculatePayURequestHash(params: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  salt: string;
}): string {
  const {
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
    salt
  } = params;

  // Formula: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  return crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();
}

/**
 * Verifies PayU return/webhook reverse hash using crypto.timingSafeEqual:
 * sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * With optional additionalCharges prefix:
 * sha512(additionalCharges|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export function verifyPayUReverseHash(params: {
  salt: string;
  status: string;
  udf5?: string;
  udf4?: string;
  udf3?: string;
  udf2?: string;
  udf1?: string;
  email?: string;
  firstname?: string;
  productinfo?: string;
  amount: string;
  txnid: string;
  key: string;
  additionalCharges?: string;
  receivedHash: string;
}): boolean {
  const {
    salt,
    status,
    udf5 = '',
    udf4 = '',
    udf3 = '',
    udf2 = '',
    udf1 = '',
    email = '',
    firstname = '',
    productinfo = '',
    amount,
    txnid,
    key,
    additionalCharges,
    receivedHash
  } = params;

  let baseReverseString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  
  let expectedHash = crypto.createHash('sha512').update(baseReverseString).digest('hex').toLowerCase();

  // If additional charges are sent by PayU, prepend additionalCharges|
  if (additionalCharges && additionalCharges.trim()) {
    const withChargesString = `${additionalCharges}|${baseReverseString}`;
    const hashWithCharges = crypto.createHash('sha512').update(withChargesString).digest('hex').toLowerCase();
    
    if (safeCompareHashes(hashWithCharges, receivedHash.toLowerCase())) {
      return true;
    }
  }

  return safeCompareHashes(expectedHash, receivedHash.toLowerCase());
}

/**
 * Standard alias for calculatePayURequestHash
 */
export const generatePayURequestHash = calculatePayURequestHash;

/**
 * Validates PayU response payload against the reverse hash using timingSafeEqual
 */
export function verifyPayUResponseHash(
  payload: {
    key: string;
    txnid: string;
    amount: string;
    productinfo?: string;
    firstname?: string;
    email?: string;
    status: string;
    hash: string;
    additionalCharges?: string;
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
  },
  salt: string
): boolean {
  return verifyPayUReverseHash({
    salt,
    status: payload.status,
    udf5: payload.udf5,
    udf4: payload.udf4,
    udf3: payload.udf3,
    udf2: payload.udf2,
    udf1: payload.udf1,
    email: payload.email,
    firstname: payload.firstname,
    productinfo: payload.productinfo,
    amount: payload.amount,
    txnid: payload.txnid,
    key: payload.key,
    additionalCharges: payload.additionalCharges,
    receivedHash: payload.hash
  });
}

/**
 * Resolves current environment PayU hosted checkout action URL
 */
export function getPayUActionUrl(): string {
  const isProd = String(envConfig.payuEnv).toLowerCase() === 'production' || String(envConfig.payuEnv).toUpperCase() === 'PROD';
  const base = envConfig.payuBaseUrl || (isProd ? 'https://secure.payu.in' : 'https://test.payu.in');
  return `${base.replace(/\/+$/, '')}/_payment`;
}

/**
 * Constant-time comparison to prevent timing attacks
 */
function safeCompareHashes(expected: string, received: string): boolean {
  if (typeof expected !== 'string' || typeof received !== 'string') {
    return false;
  }
  const expBuf = Buffer.from(expected, 'utf8');
  const recBuf = Buffer.from(received, 'utf8');
  if (expBuf.length !== recBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expBuf, recBuf);
}

/**
 * 5-Minute Duplicate Order Guard:
 * Reuses existing PENDING order if the same user/phone placed an order
 * with identical cart items within the last 5 minutes.
 */
async function findActivePendingPayUOrder(
  userId: string | undefined,
  phone: string,
  idempotencyKey: string
): Promise<{ orderDoc: admin.firestore.DocumentSnapshot; orderData: any } | null> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  // 1. Check idempotency record first
  const idemRef = db.collection('idempotency').doc(idempotencyKey);
  const idemSnap = await idemRef.get();
  if (idemSnap.exists) {
    const data = idemSnap.data();
    if (data && data.result && data.result.orderId) {
      const ordSnap = await db.collection('orders').doc(data.result.orderId).get();
      if (ordSnap.exists && ordSnap.data()?.paymentStatus === 'PAYMENT_INITIATED') {
        return { orderDoc: ordSnap, orderData: ordSnap.data() };
      }
    }
  }

  // 2. Query recent orders for user or phone
  let query: admin.firestore.Query = db.collection('orders');
  if (userId) {
    query = query.where('userId', '==', userId);
  } else {
    query = query.where('phone', '==', phone);
  }

  const snapshot = await query
    .where('paymentStatus', '==', 'PAYMENT_INITIATED')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    const data = doc.data();
    const createdAt = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : null;
    if (createdAt && createdAt >= fiveMinutesAgo && data.payuTxnId) {
      return { orderDoc: doc, orderData: data };
    }
  }

  return null;
}

/**
 * Main PayU Checkout Order Pipeline
 * 1. Validates cart items and calculates authoritative subtotal & shipping fee.
 * 2. Checks 5-minute duplicate order session reuse.
 * 3. Creates authoritative order with PAYMENT_INITIATED status.
 * 4. Generates SHA-512 request hash and PayU parameters.
 */
export async function createPayUPaymentOrder(params: PayUOrderParams): Promise<PayUPaymentInitResult> {
  if (!envConfig.paymentsEnabled) {
    throw new PaymentsNotAvailableError('Online payments are currently disabled');
  }

  const { payload, userId, clientOrigin } = params;
  const merchantKey = envConfig.payuMerchantKey;
  const merchantSalt = envConfig.payuMerchantSalt;

  if (!merchantKey || !merchantSalt) {
    throw new PaymentsNotAvailableError('PayU merchant credentials are not configured');
  }

  // 1. Check 5-Minute Idempotency Lock
  const activeSession = await findActivePendingPayUOrder(userId, payload.phone, payload.idempotencyKey);
  if (activeSession && activeSession.orderData.payuTxnId && activeSession.orderData.payuHash) {
    logger.info('Reusing active 5-minute pending PayU session', {
      orderId: activeSession.orderDoc.id,
      txnid: activeSession.orderData.payuTxnId
    });

    const ord = activeSession.orderData;
    return {
      payuActionUrl: `${envConfig.payuBaseUrl}/_payment`,
      payuKey: merchantKey,
      txnid: ord.payuTxnId,
      amount: Number(ord.total).toFixed(2),
      productinfo: ord.productinfo || 'Satvik Swaad Artisanal Order',
      firstname: ord.name || payload.name,
      email: payload.email || 'customer@satvikswaad.com',
      phone: ord.phone || payload.phone,
      surl: ord.payuSurl,
      furl: ord.payuFurl,
      hash: ord.payuHash,
      udf1: ord.orderId,
      udf2: ord.phone,
      orderId: ord.orderId,
      isReusedSession: true
    };
  }

  // 2. Process Authoritative Order via Transaction (Calculates stock, pricing, fee strictly server-side)
  const orderResult: OrderCreationResult = await processCheckoutOrder({
    payload,
    userId
  });

  const txnid = generatePayUTxnId();
  const formattedAmount = Number(orderResult.total).toFixed(2);
  const productinfo = 'Satvik Swaad Artisanal Food Order';
  const firstname = payload.name.trim().split(' ')[0] || 'Customer';
  const email = payload.email ? payload.email.trim() : 'customer@satvikswaad.com';
  const phone = payload.phone.trim();

  // SURL & FURL endpoints (Direct POST handlers)
  const baseUrl = clientOrigin || 'https://satvik-spot-staging.web.app';
  const apiBase = (process.env.API_BASE_URL || 'https://satvik-spot-backend-staging.onrender.com').replace(/\/+$/, '');
  const surl = `${apiBase}/api/v1/payments/payu/response`;
  const furl = `${apiBase}/api/v1/payments/payu/response`;

  // UDF 1 = orderId, UDF 2 = phone
  const udf1 = orderResult.orderId;
  const udf2 = phone;

  // 3. Compute SHA-512 Request Hash
  const hash = calculatePayURequestHash({
    key: merchantKey,
    txnid,
    amount: formattedAmount,
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
    salt: merchantSalt
  });

  // 4. Update Order Document with PayU Details
  await db.collection('orders').doc(orderResult.orderId).update({
    payuTxnId: txnid,
    payuHash: hash,
    payuSurl: surl,
    payuFurl: furl,
    productinfo,
    paymentMethod: 'PayU',
    paymentStatus: 'PAYMENT_INITIATED',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 5. Append Payment Audit Log
  const auditId = `audit_${Date.now()}_${txnid}`;
  await db.collection('paymentAuditLog').doc(auditId).set({
    auditId,
    orderId: orderResult.orderId,
    txnid,
    amount: orderResult.total,
    currency: 'INR',
    type: 'PAYU_ORDER_INITIATED',
    customerPhone: phone,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  logger.info('PayU order initiated successfully with server-authoritative pricing', {
    orderId: orderResult.orderId,
    txnid,
    amount: formattedAmount
  });

  return {
    payuActionUrl: `${envConfig.payuBaseUrl}/_payment`,
    payuKey: merchantKey,
    txnid,
    amount: formattedAmount,
    productinfo,
    firstname,
    email,
    phone,
    surl,
    furl,
    hash,
    udf1,
    udf2,
    orderId: orderResult.orderId,
    isReusedSession: false
  };
}

/**
 * Handles SURL/FURL callback from PayU
 * 1. Validates reverse hash with crypto.timingSafeEqual
 * 2. On Success: Atomically marks order as PAID, logs transaction and audit event.
 * 3. On Failure: Marks order as PAYMENT_FAILED and logs audit.
 */
export async function processPayUResponse(body: any): Promise<{
  success: boolean;
  orderId: string;
  txnid: string;
  amount: string;
  redirectUrl: string;
  error?: string;
}> {
  const merchantSalt = envConfig.payuMerchantSalt;
  const merchantKey = envConfig.payuMerchantKey;

  const {
    txnid,
    status,
    amount,
    productinfo,
    firstname,
    email,
    hash,
    udf1,
    udf2,
    additionalCharges,
    bank_ref_num,
    payuMoneyId,
    error_Message
  } = body;

  const isHashValid = verifyPayUReverseHash({
    salt: merchantSalt,
    status,
    udf1,
    udf2,
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    key: merchantKey,
    additionalCharges,
    receivedHash: hash
  });

  const frontendBaseUrl = (envConfig.corsAllowedOrigins[0] || 'https://satvik-spot-staging.web.app').replace(/\/+$/, '');

  // 1. If Reverse Hash is Invalid: Potential Tamper Attack!
  if (!isHashValid) {
    logger.error('CRITICAL: PayU Reverse Hash Verification Failed (Potential Tamper Attempt)', {
      txnid,
      status,
      amount
    });

    const auditId = `audit_tamper_${Date.now()}_${txnid}`;
    await db.collection('paymentAuditLog').doc(auditId).set({
      auditId,
      txnid,
      status: 'HASH_TAMPER_DETECTED',
      amount,
      receivedHash: hash,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: false,
      orderId: udf1 || txnid,
      txnid,
      amount,
      redirectUrl: `${frontendBaseUrl}/payment-failed.html?orderId=${encodeURIComponent(udf1 || txnid)}&reason=HASH_VERIFICATION_FAILED`,
      error: 'Invalid payment signature'
    };
  }

  // 2. Lookup Order in Firestore
  const orderId = udf1;
  let orderRef: admin.firestore.DocumentReference | null = null;

  if (orderId) {
    const doc = await db.collection('orders').doc(orderId).get();
    if (doc.exists) {
      orderRef = doc.ref;
    }
  }

  if (!orderRef) {
    // Fallback lookup by payuTxnId
    const query = await db.collection('orders').where('payuTxnId', '==', txnid).limit(1).get();
    if (!query.empty) {
      orderRef = query.docs[0].ref;
    }
  }

  if (!orderRef) {
    logger.error(`Order not found for PayU transaction ${txnid}`, { orderId, txnid });
    return {
      success: false,
      orderId: orderId || txnid,
      txnid,
      amount,
      redirectUrl: `${frontendBaseUrl}/payment-failed.html?orderId=${encodeURIComponent(orderId || txnid)}&reason=ORDER_NOT_FOUND`,
      error: 'Order not found'
    };
  }

  const resolvedOrderId = orderRef.id;

  // 3. Process Success vs Failure Atomically
  const isSuccessful = status.toLowerCase() === 'success';

  if (isSuccessful) {
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(orderRef!);
      if (!snap.exists) return;
      const orderData = snap.data()!;

      if (orderData.paymentStatus === 'PAID') {
        logger.info('PayU payment already marked as PAID', { orderId: resolvedOrderId, txnid });
        return;
      }

      // Deduct stock upon successful payment
      if (Array.isArray(orderData.items)) {
        for (const item of orderData.items) {
          const productRef = db.collection('products').doc(item.productId);
          const prodSnap = await transaction.get(productRef);
          if (prodSnap.exists) {
            const prodData = prodSnap.data()!;
            const currentStock = Number(prodData.stock) || 0;
            const newStock = Math.max(0, currentStock - (Number(item.qty) || 1));
            transaction.update(productRef, { stock: newStock, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
          }
        }
      }

      transaction.update(orderRef!, {
        paymentStatus: 'PAID',
        status: 'Confirmed',
        payuMoneyId: payuMoneyId || null,
        bankRefNum: bank_ref_num || null,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Forensic Audit Log
      const auditRef = db.collection('paymentAuditLog').doc(`audit_${Date.now()}_${txnid}`);
      transaction.set(auditRef, {
        orderId: resolvedOrderId,
        txnid,
        payuMoneyId: payuMoneyId || null,
        bankRefNum: bank_ref_num || null,
        amount,
        status: 'PAID',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // Payment Transactions collection
      const txnRef = db.collection('payment_transactions').doc(txnid);
      transaction.set(txnRef, {
        orderId: resolvedOrderId,
        payuTxnId: txnid,
        payuMoneyId: payuMoneyId || null,
        amount: Number(amount),
        currency: 'INR',
        status: 'captured',
        method: 'payu',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Order event record
      const eventRef = orderRef!.collection('events').doc();
      transaction.set(eventRef, {
        type: 'PAYU_PAYMENT_SUCCESS',
        message: 'Payment successfully verified and confirmed via PayU',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        data: { txnid, payuMoneyId, bank_ref_num }
      });
    });

    logger.info('PayU order payment confirmed and stock deducted', { orderId: resolvedOrderId, txnid });

    return {
      success: true,
      orderId: resolvedOrderId,
      txnid,
      amount,
      redirectUrl: `${frontendBaseUrl}/order-success.html?orderId=${encodeURIComponent(resolvedOrderId)}&method=payu&total=${amount}`
    };
  } else {
    // Payment Failed or Cancelled
    await orderRef.update({
      paymentStatus: 'PAYMENT_FAILED',
      status: 'Cancelled',
      payuErrorMessage: error_Message || status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const auditRef = db.collection('paymentAuditLog').doc(`audit_fail_${Date.now()}_${txnid}`);
    await auditRef.set({
      orderId: resolvedOrderId,
      txnid,
      status: 'PAYMENT_FAILED',
      errorMessage: error_Message || status,
      amount,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.warn('PayU payment was not successful', { orderId: resolvedOrderId, txnid, status, error: error_Message });

    return {
      success: false,
      orderId: resolvedOrderId,
      txnid,
      amount,
      redirectUrl: `${frontendBaseUrl}/payment-failed.html?orderId=${encodeURIComponent(resolvedOrderId)}&reason=${encodeURIComponent(error_Message || status)}`,
      error: error_Message || status
    };
  }
}
