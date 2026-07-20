import { Response, NextFunction } from 'express';
import { db, admin } from '../config/firebase';
import { AuthenticatedRequest } from '../auth/verifyAuth';
import { ValidationError } from '../errors/AppError';
import { logger } from '../utils/logger';

export interface CreateReviewPayload {
  productId: string;
  name: string;
  rating: number;
  text: string;
}

export async function handleCreateReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { productId, name, rating, text } = req.body as CreateReviewPayload;
    const userId = req.user?.uid;

    if (!productId || typeof productId !== 'string') {
      throw new ValidationError('Product ID is required');
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      throw new ValidationError('Name must be between 2 and 100 characters');
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be an integer between 1 and 5');
    }

    if (!text || typeof text !== 'string' || text.trim().length < 5 || text.trim().length > 500) {
      throw new ValidationError('Review text must be between 5 and 500 characters');
    }

    // Verify product exists
    const prodDoc = await db.collection('products').doc(productId).get();
    if (!prodDoc.exists) {
      throw new ValidationError('Product does not exist');
    }

    // Check if user has a verified purchase
    let verifiedPurchase = false;
    if (userId) {
      const ordersSnap = await db.collection('orders')
        .where('userId', '==', userId)
        .where('status', '==', 'Delivered')
        .get();

      if (!ordersSnap.empty) {
        verifiedPurchase = true;
      }
    }

    const reviewData = {
      productId,
      name: name.trim(),
      rating,
      stars: rating,
      text: text.trim(),
      approved: false, // Default approved=false (Must be moderated)
      verifiedPurchase,
      userId: userId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('reviews').add(reviewData);
    logger.info('Review submitted for moderation', { reviewId: docRef.id, productId, approved: false });

    return res.status(201).json({
      success: true,
      data: { reviewId: docRef.id, approved: false, verifiedPurchase, message: 'Review submitted for moderation.' }
    });
  } catch (error) {
    return next(error);
  }
}
