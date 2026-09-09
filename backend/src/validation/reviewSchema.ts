import { ValidationError } from '../errors/AppError';

export interface CreateReviewPayload {
  productId: string;
  name: string;
  rating: number;
  text: string;
}

const ALLOWED_REVIEW_KEYS = new Set(['productId', 'name', 'rating', 'text']);

/**
 * Validates payload for product review creation.
 * Strictly disallows unexpected/unknown keys.
 */
export function validateCreateReviewPayload(body: any): CreateReviewPayload {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Invalid request payload format');
  }

  const keys = Object.keys(body);
  for (const k of keys) {
    if (!ALLOWED_REVIEW_KEYS.has(k)) {
      throw new ValidationError(`Forbidden or unexpected field in request: '${k}'`);
    }
  }

  const { productId, name, rating, text } = body;

  if (typeof productId !== 'string' || productId.trim().length === 0 || productId.trim().length > 100) {
    throw new ValidationError('Product ID is required');
  }

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    throw new ValidationError('Name must be between 2 and 100 characters');
  }

  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be an integer between 1 and 5');
  }

  if (typeof text !== 'string' || text.trim().length < 5 || text.trim().length > 500) {
    throw new ValidationError('Review text must be between 5 and 500 characters');
  }

  return {
    productId: productId.trim(),
    name: name.trim(),
    rating,
    text: text.trim()
  };
}
