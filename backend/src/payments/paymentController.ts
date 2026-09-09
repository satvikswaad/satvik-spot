import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/verifyAuth';
import { validateCreatePaymentPayload, validateVerifyPaymentPayload, validateRefundPayload } from './paymentSchema';
import { createRazorpayOrder, processPaymentSuccess, processWebhookEvent, verifyWebhookSignature, initiateRefund, getRazorpayCredentials } from './razorpayService';
import { processCheckoutOrder } from '../orders/orderService';
import { AppError, PaymentsNotAvailableError } from '../errors/AppError';
import { envConfig } from '../config/environment';
import { logger } from '../utils/logger';
import { db } from '../config/firebase';

export async function createPaymentOrderHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!envConfig.paymentsEnabled) {
      throw new PaymentsNotAvailableError('Payments are currently disabled');
    }
    
    const validatedData = validateCreatePaymentPayload(req.body);
    
    // Create the order in Firestore with status PAYMENT_INITIATED
    const orderData = await processCheckoutOrder({
      payload: validatedData,
      userId: req.user?.uid
    });
    
    const amountInPaise = Math.round(orderData.total * 100);
    
    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder(
      orderData.orderId,
      amountInPaise,
      validatedData.name,
      validatedData.phone
    );
    
    // Update order with razorpayOrderId
    await db.collection('orders').doc(orderData.orderId).update({
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: 'PAYMENT_INITIATED'
    });
    
    const { keyId } = getRazorpayCredentials();
    
    res.status(201).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: keyId,
        amount: amountInPaise,
        currency: 'INR',
        orderId: orderData.orderId
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyPaymentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = validateVerifyPaymentPayload(req.body);
    
    const result = await processPaymentSuccess(
      validatedData.razorpay_order_id,
      validatedData.razorpay_payment_id,
      validatedData.razorpay_signature
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function webhookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const rawBody = (req as any).rawBody || req.body;
    const signature = req.headers['x-razorpay-signature'] as string;
    
    if (!signature) {
      throw new AppError('Missing X-Razorpay-Signature header', 400, 'MISSING_SIGNATURE');
    }
    
    const bodyStr = typeof rawBody === 'string' ? rawBody : 
                    Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : 
                    JSON.stringify(rawBody);
    
    if (!verifyWebhookSignature(bodyStr, signature)) {
      throw new AppError('Invalid webhook signature', 400, 'INVALID_SIGNATURE');
    }
    
    const payload = typeof req.body === 'string' || Buffer.isBuffer(req.body) 
      ? JSON.parse(bodyStr) 
      : req.body;
      
    await processWebhookEvent(payload, bodyStr, signature);
    
    res.status(200).send('OK');
  } catch (error) {
    logger.error(`Webhook processing error: ${error}`);
    if (error instanceof AppError && error.statusCode === 400) {
      res.status(400).send(error.message);
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
}

export async function refundHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const validatedData = validateRefundPayload(req.body);
    
    const result = await initiateRefund(
      validatedData.orderId,
      validatedData.amount,
      validatedData.reason,
      req.user?.uid
    );
    
    res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}
