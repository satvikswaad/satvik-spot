import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/verifyAuth';
import { validateCreateOrderPayload } from '../validation/orderSchema';
import { processAuthoritativeOrder } from './orderService';
import { hashGuestSecret } from '../guest/guestService';
import { db } from '../config/firebase';
import { ValidationError, AuthorizationError, AppError, CommerceNotAvailableError } from '../errors/AppError';
import { envConfig } from '../config/environment';
import { logger } from '../utils/logger';

export async function createOrderHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // 0. Server-authoritative feature gate check
    if (!envConfig.commerceEnabled || !envConfig.checkoutEnabled) {
      throw new CommerceNotAvailableError();
    }

    // 1. Payload validation
    const validatedPayload = validateCreateOrderPayload(req.body);

    // 2. Extract user identity from verified Bearer Auth Token
    const userId = req.user?.uid;

    // 3. Process Authoritative Order
    const result = await processAuthoritativeOrder({
      payload: validatedPayload,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export const handleCreateOrder = createOrderHandler;

export async function lookupGuestOrderHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { orderId, guestAccessSecret } = req.body;

    if (typeof orderId !== 'string' || !orderId.trim() || typeof guestAccessSecret !== 'string' || !guestAccessSecret.trim()) {
      throw new ValidationError('Both orderId and guestAccessSecret are required for guest lookup');
    }

    const docRef = db.collection('orders').doc(orderId.trim());
    const snap = await docRef.get();

    if (!snap.exists) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    const data = snap.data()!;

    if (!data.guestSecretHash) {
      throw new AuthorizationError('Guest lookup is not permitted for this order type');
    }

    const providedHash = hashGuestSecret(guestAccessSecret.trim());
    if (providedHash !== data.guestSecretHash) {
      logger.warn('Failed guest order lookup attempt with invalid secret', { orderId });
      throw new AuthorizationError('Invalid guest access secret');
    }

    // Omit internal secret hash before sending back
    const { guestSecretHash, ...safeOrderData } = data;

    res.status(200).json({
      success: true,
      data: safeOrderData
    });
  } catch (error) {
    next(error);
  }
}

export const handleGuestLookup = lookupGuestOrderHandler;
