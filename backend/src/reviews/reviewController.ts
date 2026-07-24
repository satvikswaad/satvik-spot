import { Request, Response, NextFunction } from 'express';
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

    if (!productId || typeof productId !== 'string' || productId.trim().length === 0) {
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

export async function handleGetApprovedReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const productId = req.query.productId ? String(req.query.productId).trim() : null;

    if (productId && (productId.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(productId))) {
      throw new ValidationError('Invalid product ID format');
    }

    let query: admin.firestore.Query = db.collection('reviews').where('approved', '==', true);

    if (productId) {
      query = query.where('productId', '==', productId);
    }

    const snap = await query.get();

    const reviews = snap.docs.map(doc => {
      const data = doc.data();
      const rawName = typeof data.name === 'string' ? data.name.trim() : 'Verified Buyer';
      const nameParts = rawName.split(' ');
      const safeName = nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
        : rawName;

      return {
        id: doc.id,
        productId: data.productId,
        name: safeName,
        rating: typeof data.rating === 'number' ? data.rating : (data.stars || 5),
        text: data.text || '',
        verifiedPurchase: Boolean(data.verifiedPurchase),
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString()
      };
    });

    return res.status(200).json({
      success: true,
      data: { reviews, count: reviews.length }
    });
  } catch (error) {
    return next(error);
  }
}
