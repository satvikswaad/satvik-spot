import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/verifyAuth';
import { validateCreateOrderPayload, validateSubmitUtrPayload, validateGuestLookupPayload } from '../validation/orderSchema';
import { processAuthoritativeOrder, processWhatsAppOrderRequest, submitUtrForOrder } from './orderService';
import { hashGuestSecret } from '../guest/guestService';
import { db } from '../config/firebase';
import { ValidationError, AuthorizationError, AppError, CommerceNotAvailableError } from '../errors/AppError';
import { assertOrderOwnership } from '../auth/securityGateService';
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

export async function createWhatsAppOrderHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Check feature flag: WHATSAPP_ASSISTED_ORDERING_ENABLED
    if (!envConfig.whatsappAssistedOrderingEnabled) {
      throw new CommerceNotAvailableError('WhatsApp-assisted ordering is currently disabled.');
    }

    const validatedPayload = validateCreateOrderPayload(req.body);
    const userId = req.user?.uid;

    const result = await processWhatsAppOrderRequest({
      payload: validatedPayload,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'WhatsApp order request created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export const handleCreateWhatsAppOrder = createWhatsAppOrderHandler;

export async function submitUtrHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { orderId, utr, guestAccessSecret } = validateSubmitUtrPayload(req.body);

    const result = await submitUtrForOrder(orderId, utr, guestAccessSecret);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function lookupGuestOrderHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { orderId, guestAccessSecret } = validateGuestLookupPayload(req.body);

    const docRef = db.collection('orders').doc(orderId.trim());
    const snap = await docRef.get();

    if (!snap.exists) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    const data = snap.data()!;

    // AUTH-2, AUTH-3: Enforce BOLA via canonical assertOrderOwnership (returns 404 on mismatch)
    assertOrderOwnership(
      {
        orderId: data.orderId || orderId,
        userId: data.userId,
        guestTokenHash: data.guestSecretHash || data.guestTokenHash
      },
      {
        guestToken: guestAccessSecret.trim(),
        uid: req.user?.uid,
        isAdmin: req.user?.isAdmin
      }
    );

    // Omit internal secret hash before sending back
    const { guestSecretHash, guestTokenHash, ...safeOrderData } = data;

    res.status(200).json({
      success: true,
      data: safeOrderData
    });
  } catch (error) {
    next(error);
  }
}

export const handleGuestLookup = lookupGuestOrderHandler;
