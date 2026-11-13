import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, admin } from '../config/firebase';
import { ValidationError, AuthorizationError } from '../errors/AppError';
import { verifyTurnstileToken } from '../security/turnstile';
import { AuthenticatedRequest } from '../auth/verifyAuth';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Public Newsletter Subscription Endpoint (POST /api/v1/newsletter/subscribe)
 * Decision D8 & Spec: API-only, Turnstile verification, explicit consent boolean, rate limited.
 */
export async function subscribeNewsletterHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, consent, turnstileToken } = req.body || {};

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()) || email.trim().length > 255) {
      throw new ValidationError('A valid email address is required.');
    }

    if (consent !== true) {
      throw new ValidationError('Explicit consent is required to subscribe to the newsletter.');
    }

    const isVerified = await verifyTurnstileToken(turnstileToken, req.ip);
    if (!isVerified) {
      throw new ValidationError('Security bot verification failed. Please complete the verification challenge.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailHash = crypto.createHash('sha256').update(normalizedEmail).digest('hex');

    const subscriberRef = db.collection('newsletterSubscribers').doc(emailHash);
    await subscriberRef.set({
      email: normalizedEmail,
      emailHash,
      consent: true,
      consentTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'ACTIVE',
      channel: 'STOREFRONT'
    }, { merge: true });

    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed to the Satvik Swaad newsletter.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin Newsletter Subscribers List Endpoint (GET /api/v1/admin/newsletter/subscribers)
 * Cursor-based pagination with limit 50 max (UI-4).
 */
export async function getNewsletterSubscribersHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.isAdmin) {
      throw new AuthorizationError('Administrative privileges required');
    }

    const limitNum = Math.min(parseInt(req.query.limit as string || '50', 10), 50);
    const startAfterId = req.query.startAfter as string | undefined;

    let query = db.collection('newsletterSubscribers')
      .orderBy('subscribedAt', 'desc')
      .limit(limitNum);

    if (startAfterId) {
      const cursorDoc = await db.collection('newsletterSubscribers').doc(startAfterId).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const subscribers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = lastDoc ? lastDoc.id : null;

    return res.status(200).json({
      success: true,
      subscribers,
      nextCursor
    });
  } catch (err) {
    next(err);
  }
}
