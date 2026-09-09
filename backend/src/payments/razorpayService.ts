import * as crypto from 'crypto';
import { db, admin } from '../config/firebase';
import { AppError, ValidationError, PaymentsNotAvailableError } from '../errors/AppError';
import { logger } from '../utils/logger';

// Razorpay REST API interfaces
interface RazorpayOrderOptions {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

interface PaymentVerificationParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface WebhookPayload {
  event: string;
  payload: {
    payment?: { entity: any };
    order?: { entity: any };
    refund?: { entity: any };
  };
}

export function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    throw new PaymentsNotAvailableError('Razorpay credentials not configured');
  }
  
  return { keyId, keySecret };
}

export async function createRazorpayOrder(
  internalOrderId: string, 
  amountInPaise: number, 
  customerName: string, 
  customerPhone: string
): Promise<RazorpayOrderResponse> {
  const { keyId, keySecret } = getRazorpayCredentials();
  
  const options: RazorpayOrderOptions = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: internalOrderId,
    notes: {
      customerName,
      customerPhone,
      internalOrderId
    }
  };

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  
  logger.info(`Creating Razorpay order for internal ID: ${internalOrderId}`);
  
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error(`Razorpay order creation failed: ${response.status} ${errorBody}`);
    throw new AppError('Failed to create payment order', 500, 'PAYMENT_GATEWAY_ERROR');
  }

  const data = (await response.json()) as RazorpayOrderResponse;
  logger.info(`Razorpay order created successfully: ${data.id}`);
  return data;
}

export function verifyPaymentSignature(params: PaymentVerificationParams): boolean {
  const { keySecret } = getRazorpayCredentials();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;
  
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body.toString())
    .digest('hex');
    
  if (expectedSignature.length !== razorpay_signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(razorpay_signature)
  );
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new PaymentsNotAvailableError('Webhook secret not configured');
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');
    
  if (expectedSignature.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

export async function processPaymentSuccess(
  razorpayOrderId: string, 
  razorpayPaymentId: string, 
  razorpaySignature: string
) {
  const isValid = verifyPaymentSignature({
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature
  });
  
  if (!isValid) {
    throw new AppError('Payment signature verification failed', 400, 'INVALID_PAYMENT_SIGNATURE');
  }

  return await db.runTransaction(async (t: any) => {
    const ordersRef = db.collection('orders');
    const querySnapshot = await t.get(ordersRef.where('razorpayOrderId', '==', razorpayOrderId).limit(1));
    
    if (querySnapshot.empty) {
      throw new AppError(`No order found for Razorpay order ID ${razorpayOrderId}`, 404, 'ORDER_NOT_FOUND');
    }
    
    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();
    
    if (orderData.paymentStatus === 'PAYMENT_CONFIRMED') {
      return { success: true, message: 'Payment already confirmed', orderId: orderDoc.id };
    }
    
    t.update(orderDoc.ref, {
      paymentStatus: 'PAYMENT_CONFIRMED',
      status: 'Confirmed',
      razorpayPaymentId,
      paidAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const paymentTransactionRef = db.collection('payment_transactions').doc();
    t.set(paymentTransactionRef, {
      orderId: orderDoc.id,
      razorpayOrderId,
      razorpayPaymentId,
      amount: orderData.total ?? orderData.totalAmount ?? 0,
      currency: 'INR',
      status: 'captured',
      method: 'razorpay',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const eventRef = orderDoc.ref.collection('events').doc();
    t.set(eventRef, {
      type: 'PAYMENT_SUCCESS',
      message: 'Payment successfully captured via Razorpay',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      data: { razorpayPaymentId }
    });
    
    return { success: true, orderId: orderDoc.id };
  });
}

export async function processWebhookEvent(eventBody: WebhookPayload, rawBody: string, signature: string) {
  if (!verifyWebhookSignature(rawBody, signature)) {
    throw new AppError('Webhook signature verification failed', 400, 'INVALID_WEBHOOK_SIGNATURE');
  }

  const event = eventBody.event;
  
  if (event === 'payment.captured') {
    const paymentEntity = eventBody.payload.payment?.entity;
    if (!paymentEntity) return { success: true };
    
    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;
    
    await db.runTransaction(async (t: any) => {
      const ordersRef = db.collection('orders');
      const querySnapshot = await t.get(ordersRef.where('razorpayOrderId', '==', razorpayOrderId).limit(1));
      
      if (querySnapshot.empty) return;
      
      const orderDoc = querySnapshot.docs[0];
      const orderData = orderDoc.data();
      
      if (orderData.paymentStatus === 'PAYMENT_CONFIRMED') return;
      
      t.update(orderDoc.ref, {
        paymentStatus: 'PAYMENT_CONFIRMED',
        status: 'Confirmed',
        razorpayPaymentId,
        paidAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      const paymentTransactionRef = db.collection('payment_transactions').doc();
      t.set(paymentTransactionRef, {
        orderId: orderDoc.id,
        razorpayOrderId,
        razorpayPaymentId,
        amount: paymentEntity.amount / 100,
        currency: paymentEntity.currency || 'INR',
        status: 'captured',
        method: 'razorpay',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      const eventRef = orderDoc.ref.collection('events').doc();
      t.set(eventRef, {
        type: 'WEBHOOK_PAYMENT_CAPTURED',
        message: 'Payment successfully captured via webhook',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        data: { razorpayPaymentId }
      });
    });
  } else if (event === 'payment.failed') {
    const paymentEntity = eventBody.payload.payment?.entity;
    if (!paymentEntity) return { success: true };
    
    const razorpayOrderId = paymentEntity.order_id;
    
    await db.runTransaction(async (t: any) => {
      const ordersRef = db.collection('orders');
      const querySnapshot = await t.get(ordersRef.where('razorpayOrderId', '==', razorpayOrderId).limit(1));
      
      if (querySnapshot.empty) return;
      
      const orderDoc = querySnapshot.docs[0];
      const orderData = orderDoc.data();
      
      if (orderData.paymentStatus === 'PAYMENT_FAILED' || orderData.paymentStatus === 'PAYMENT_CONFIRMED') return;
      
      t.update(orderDoc.ref, {
        paymentStatus: 'PAYMENT_FAILED'
      });
      
      const paymentTransactionRef = db.collection('payment_transactions').doc();
      t.set(paymentTransactionRef, {
        orderId: orderDoc.id,
        razorpayOrderId,
        razorpayPaymentId: paymentEntity.id,
        amount: paymentEntity.amount / 100,
        currency: paymentEntity.currency || 'INR',
        status: 'failed',
        method: 'razorpay',
        errorDescription: paymentEntity.error_description,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      const eventRef = orderDoc.ref.collection('events').doc();
      t.set(eventRef, {
        type: 'WEBHOOK_PAYMENT_FAILED',
        message: 'Payment failed via webhook',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        data: { error: paymentEntity.error_description }
      });
    });
  } else if (event === 'refund.processed') {
    const refundEntity = eventBody.payload.refund?.entity;
    const paymentEntity = eventBody.payload.payment?.entity;
    
    if (!refundEntity || !paymentEntity) return { success: true };
    
    const razorpayOrderId = paymentEntity.order_id;
    
    await db.runTransaction(async (t: any) => {
      const ordersRef = db.collection('orders');
      const querySnapshot = await t.get(ordersRef.where('razorpayOrderId', '==', razorpayOrderId).limit(1));
      
      if (querySnapshot.empty) return;
      
      const orderDoc = querySnapshot.docs[0];
      
      const refundRef = db.collection('refunds').doc(refundEntity.id);
      const refundSnapshot = await t.get(refundRef);
      if (refundSnapshot.exists) return; // Idempotent
      
      t.set(refundRef, {
        orderId: orderDoc.id,
        razorpayRefundId: refundEntity.id,
        razorpayPaymentId: paymentEntity.id,
        amount: refundEntity.amount / 100,
        status: 'processed',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      t.update(orderDoc.ref, {
        paymentStatus: 'REFUNDED',
        status: 'Cancelled'
      });
      
      const eventRef = orderDoc.ref.collection('events').doc();
      t.set(eventRef, {
        type: 'WEBHOOK_REFUND_PROCESSED',
        message: `Refund of ${refundEntity.amount / 100} processed via webhook`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        data: { refundId: refundEntity.id }
      });
    });
  }
  
  return { success: true };
}

export async function initiateRefund(orderId: string, amount?: number, reason?: string, adminId?: string) {
  const { keyId, keySecret } = getRazorpayCredentials();
  
  return await db.runTransaction(async (t: any) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await t.get(orderRef);
    
    if (!orderDoc.exists) {
      throw new AppError(`Order not found with ID ${orderId}`, 404, 'ORDER_NOT_FOUND');
    }
    
    const orderData = orderDoc.data()!;
    if (orderData.paymentStatus === 'REFUNDED') {
      throw new AppError('Order has already been refunded', 400, 'ALREADY_REFUNDED');
    }
    
    const razorpayPaymentId = orderData.razorpayPaymentId;
    if (!razorpayPaymentId) {
      throw new AppError('No Razorpay payment ID found for this order', 400, 'NO_PAYMENT_FOUND');
    }
    
    const refundData: any = {};
    if (amount) {
      refundData.amount = amount * 100;
    }
    if (reason) {
      refundData.notes = { reason, adminId: adminId || 'unknown' };
    }
    
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    const response = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: Object.keys(refundData).length > 0 ? JSON.stringify(refundData) : undefined
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`Razorpay refund failed: ${response.status} ${errorBody}`);
      throw new AppError('Failed to initiate refund with payment gateway', 500, 'REFUND_FAILED');
    }
    
    const data = await response.json();
    
    const refundRef = db.collection('refunds').doc(data.id);
    t.set(refundRef, {
      orderId,
      razorpayRefundId: data.id,
      razorpayPaymentId,
      amount: data.amount / 100,
      status: data.status,
      reason: reason || null,
      adminId: adminId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    t.update(orderRef, {
      paymentStatus: 'REFUND_INITIATED'
    });
    
    const eventRef = orderRef.collection('events').doc();
    t.set(eventRef, {
      type: 'REFUND_INITIATED',
      message: `Refund initiated for amount ${data.amount / 100}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      data: { refundId: data.id, adminId }
    });
    
    return data;
  });
}
