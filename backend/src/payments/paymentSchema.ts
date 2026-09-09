import { validateCreateOrderPayload } from '../validation/orderSchema';
import { ValidationError } from '../errors/AppError';

export function validateCreatePaymentPayload(payload: any) {
  // Reuse the order schema validator since the payload is the same
  return validateCreateOrderPayload(payload);
}

export function validateVerifyPaymentPayload(payload: any) {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload must be an object');
  }

  const allowedKeys = ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'];
  const payloadKeys = Object.keys(payload);
  
  for (const key of payloadKeys) {
    if (!allowedKeys.includes(key)) {
      throw new ValidationError(`Unknown key in payload: ${key}`);
    }
  }

  for (const key of allowedKeys) {
    if (!payload[key] || typeof payload[key] !== 'string' || payload[key].trim() === '') {
      throw new ValidationError(`Missing or invalid required string field: ${key}`);
    }
  }

  return {
    razorpay_order_id: payload.razorpay_order_id.trim(),
    razorpay_payment_id: payload.razorpay_payment_id.trim(),
    razorpay_signature: payload.razorpay_signature.trim()
  };
}

export function validateRefundPayload(payload: any) {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload must be an object');
  }

  const allowedKeys = ['orderId', 'amount', 'reason'];
  const payloadKeys = Object.keys(payload);
  
  for (const key of payloadKeys) {
    if (!allowedKeys.includes(key)) {
      throw new ValidationError(`Unknown key in payload: ${key}`);
    }
  }

  if (!payload.orderId || typeof payload.orderId !== 'string' || payload.orderId.trim() === '') {
    throw new ValidationError('Missing or invalid required string field: orderId');
  }

  if (payload.amount !== undefined) {
    if (typeof payload.amount !== 'number' || payload.amount <= 0) {
      throw new ValidationError('Amount must be a positive number');
    }
  }

  if (payload.reason !== undefined) {
    if (typeof payload.reason !== 'string' || payload.reason.length < 1 || payload.reason.length > 500) {
      throw new ValidationError('Reason must be a string between 1 and 500 characters');
    }
  }

  return {
    orderId: payload.orderId.trim(),
    amount: payload.amount,
    reason: payload.reason ? payload.reason.trim() : undefined
  };
}

export function validateWebhookPayload(payload: any) {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Webhook payload must be an object');
  }

  if (!payload.event || typeof payload.event !== 'string') {
    throw new ValidationError('Missing or invalid event field');
  }

  if (!payload.payload || typeof payload.payload !== 'object') {
    throw new ValidationError('Missing or invalid payload object');
  }

  return payload;
}
