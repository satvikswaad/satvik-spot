import { ValidationError } from '../errors/AppError';

export interface CreateMessagePayload {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
}

const ALLOWED_MESSAGE_KEYS = new Set(['name', 'email', 'phone', 'subject', 'message']);

/**
 * Validates payload for customer message submission.
 * Strictly disallows unexpected/unknown keys.
 */
export function validateCreateMessagePayload(body: any): CreateMessagePayload {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Invalid request payload format');
  }

  const keys = Object.keys(body);
  for (const k of keys) {
    if (!ALLOWED_MESSAGE_KEYS.has(k)) {
      throw new ValidationError(`Forbidden or unexpected field in request: '${k}'`);
    }
  }

  const { name, email, phone, subject, message } = body;

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    throw new ValidationError('Name must be between 2 and 100 characters');
  }

  if (typeof message !== 'string' || message.trim().length < 5 || message.trim().length > 500) {
    throw new ValidationError('Message body must be between 5 and 500 characters');
  }

  if (email !== undefined && email !== null) {
    if (typeof email !== 'string') {
      throw new ValidationError('Email must be a valid string');
    }
    const trimmedEmail = email.trim();
    if (trimmedEmail.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw new ValidationError('Invalid email address format');
    }
  }

  if (phone !== undefined && phone !== null) {
    if (typeof phone !== 'string') {
      throw new ValidationError('Phone must be a valid string');
    }
  }

  if (subject !== undefined && subject !== null) {
    if (typeof subject !== 'string' || subject.trim().length > 200) {
      throw new ValidationError('Subject must be a string up to 200 characters');
    }
  }

  return {
    name: name.trim(),
    ...(email ? { email: String(email).trim() } : {}),
    ...(phone ? { phone: String(phone).trim() } : {}),
    ...(subject ? { subject: String(subject).trim() } : {}),
    message: message.trim()
  };
}
