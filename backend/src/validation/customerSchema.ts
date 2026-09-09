import { ValidationError } from '../errors/AppError';

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  email?: string;
}

export interface AddressPayload {
  label: 'Home' | 'Work' | 'Other';
  name: string;
  phone: string;
  house: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  deliveryInstructions?: string;
  isDefault?: boolean;
}

const ALLOWED_PROFILE_KEYS = new Set(['name', 'phone', 'email']);
const ALLOWED_ADDRESS_KEYS = new Set([
  'label',
  'name',
  'phone',
  'house',
  'street',
  'landmark',
  'city',
  'state',
  'pincode',
  'deliveryInstructions',
  'isDefault'
]);

/**
 * Validates payload for updating customer profile.
 * Strictly rejects unexpected/unknown fields.
 */
export function validateUpdateProfilePayload(body: any): UpdateProfilePayload {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Invalid request payload format');
  }

  const keys = Object.keys(body);
  for (const k of keys) {
    if (!ALLOWED_PROFILE_KEYS.has(k)) {
      throw new ValidationError(`Forbidden or unexpected field in request: '${k}'`);
    }
  }

  const result: UpdateProfilePayload = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 100) {
      throw new ValidationError('Name must be between 2 and 100 characters');
    }
    result.name = body.name.trim();
  }

  if (body.phone !== undefined && body.phone !== null && body.phone !== '') {
    if (typeof body.phone !== 'string') {
      throw new ValidationError('Phone must be a valid string');
    }
    result.phone = body.phone.trim();
  } else if (body.phone === '') {
    result.phone = '';
  }

  if (body.email !== undefined && body.email !== null && body.email !== '') {
    if (typeof body.email !== 'string') {
      throw new ValidationError('Email must be a valid string');
    }
    const trimmedEmail = body.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw new ValidationError('Invalid email address format');
    }
    result.email = trimmedEmail;
  } else if (body.email === '') {
    result.email = '';
  }

  return result;
}

/**
 * Validates payload for customer saved addresses (both creation and partial update).
 * Strictly rejects unexpected/unknown fields.
 */
export function validateAddressPayload(body: any, isPartial = false): Partial<AddressPayload> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Invalid request payload format');
  }

  const keys = Object.keys(body);
  for (const k of keys) {
    if (!ALLOWED_ADDRESS_KEYS.has(k)) {
      throw new ValidationError(`Forbidden or unexpected field in request: '${k}'`);
    }
  }

  if (!isPartial) {
    // Required fields check for creation
    const requiredFields = ['label', 'name', 'phone', 'house', 'street', 'city', 'state', 'pincode'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        throw new ValidationError(`Field '${field}' is required`);
      }
    }
  }

  const result: Partial<AddressPayload> = {};

  if (body.label !== undefined) {
    if (!['Home', 'Work', 'Other'].includes(body.label)) {
      throw new ValidationError("Address label must be 'Home', 'Work', or 'Other'");
    }
    result.label = body.label;
  }

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 100) {
      throw new ValidationError('Name must be between 2 and 100 characters');
    }
    result.name = body.name.trim();
  }

  if (body.phone !== undefined) {
    if (typeof body.phone !== 'string') {
      throw new ValidationError('Phone must be a valid string');
    }
    result.phone = body.phone.trim();
  }

  if (body.house !== undefined) {
    if (typeof body.house !== 'string' || body.house.trim().length < 1) {
      throw new ValidationError('House/Flat details are required');
    }
    result.house = body.house.trim();
  }

  if (body.street !== undefined) {
    if (typeof body.street !== 'string' || body.street.trim().length < 2) {
      throw new ValidationError('Street details are required');
    }
    result.street = body.street.trim();
  }

  if (body.landmark !== undefined && body.landmark !== null) {
    if (typeof body.landmark !== 'string') {
      throw new ValidationError('Landmark must be a valid string');
    }
    result.landmark = body.landmark.trim();
  }

  if (body.city !== undefined) {
    if (typeof body.city !== 'string' || body.city.trim().length < 2) {
      throw new ValidationError('City is required');
    }
    result.city = body.city.trim();
  }

  if (body.state !== undefined) {
    if (typeof body.state !== 'string' || body.state.trim().length < 2) {
      throw new ValidationError('State is required');
    }
    result.state = body.state.trim();
  }

  if (body.pincode !== undefined) {
    if (typeof body.pincode !== 'string') {
      throw new ValidationError('PIN code must be a string');
    }
    result.pincode = body.pincode.trim();
  }

  if (body.deliveryInstructions !== undefined && body.deliveryInstructions !== null) {
    if (typeof body.deliveryInstructions !== 'string') {
      throw new ValidationError('Delivery instructions must be a string');
    }
    result.deliveryInstructions = body.deliveryInstructions.trim();
  }

  if (body.isDefault !== undefined) {
    if (typeof body.isDefault !== 'boolean') {
      throw new ValidationError('isDefault must be a boolean');
    }
    result.isDefault = body.isDefault;
  }

  return result;
}
