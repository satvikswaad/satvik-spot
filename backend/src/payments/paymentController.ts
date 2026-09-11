import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/verifyAuth';
import { validateCreatePaymentPayload, validateVerifyPaymentPayload, validateRefundPayload } from './paymentSchema';
import { validatePayUCreateOrderPayload, validatePayUResponsePayload } from './payuSchema';
import { createRazorpayOrder, processPaymentSuccess, processWebhookEvent, verifyWebhookSignature, initiateRefund, getRazorpayCredentials } from './razorpayService';
import { createPayUPaymentOrder, processPayUResponse } from './payuService';
import { processCheckoutOrder } from '../orders/orderService';
import { AppError, PaymentsNotAvailableError } from '../errors/AppError';
import { envConfig } from '../config/environment';
import { logger } from '../utils/logger';
import { db } from '../config/firebase';

/**
 * PayU Live / Test Order Initiation Handler
 * Calculates server-authoritative price, applies 5-minute idempotency guard,
 * generates SHA-512 hash, and returns form parameters.
 */
export async function createPayUOrderHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const validatedData = validatePayUCreateOrderPayload(req.body);
    const clientOrigin = (req.headers.origin || req.headers.referer || '').toString().replace(/\/+$/, '');
    
    const result = await createPayUPaymentOrder({
      payload: validatedData,
      userId: req.user?.uid,
      clientOrigin: clientOrigin || undefined
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PayU SURL / FURL Response & Webhook Handler
 * Verifies reverse SHA-512 hash with timingSafeEqual,
 * updates order status to PAID on success, and redirects client.
 */
export async function payuResponseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedBody = validatePayUResponsePayload(req.body);
    const result = await processPayUResponse(validatedBody);

    // If client requested JSON (e.g. automated pentest / API check)
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(result.success ? 200 : 400).json(result);
    }

    // Standard PayU browser POST redirect flow:
    // Render clean HTML redirect to frontend order success or failure page
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Redirecting to Satvik Swaad...</title>
          <meta http-equiv="refresh" content="0;url=${result.redirectUrl}" />
          <style>
            body { font-family: sans-serif; background: #FAF5EB; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #164328; }
            .card { background: white; padding: 32px; border-radius: 16px; border: 1.5px solid #E6DEC8; text-align: center; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${result.success ? '🌿 Payment Confirmed!' : '⚠️ Payment Notice'}</h2>
            <p>Redirecting you back to Satvik Swaad storefront...</p>
            <p><a href="${result.redirectUrl}" style="color: #1D552C; font-weight: bold;">Click here if not redirected automatically</a></p>
          </div>
          <script>
            window.location.href = "${result.redirectUrl}";
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    logger.error('Error handling PayU response callback', { error: (error as Error).message });
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYU_RESPONSE_INVALID',
          message: (error as Error).message
        }
      });
    }
    const frontendBaseUrl = (envConfig.corsAllowedOrigins[0] || 'https://satvik-spot-staging.web.app').replace(/\/+$/, '');
    res.redirect(`${frontendBaseUrl}/payment-failed.html?reason=RESPONSE_PROCESSING_ERROR`);
  }
}

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
