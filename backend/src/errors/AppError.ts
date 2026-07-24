export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;

  constructor(message: string, statusCode = 400, errorCode = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class OutOfStockError extends AppError {
  constructor(message = 'Item is out of stock') {
    super(message, 409, 'OUT_OF_STOCK');
  }
}

export class DuplicateRequestError extends AppError {
  constructor(message = 'Order has already been processed') {
    super(message, 409, 'DUPLICATE_REQUEST');
  }
}

export class CommerceNotAvailableError extends AppError {
  constructor(message = 'Online ordering will open after required registrations and launch preparations are completed.') {
    super(message, 503, 'COMMERCE_NOT_AVAILABLE');
  }
}

export class PaymentsNotAvailableError extends AppError {
  constructor(message = 'Payment processing is currently disabled.') {
    super(message, 503, 'PAYMENTS_NOT_AVAILABLE');
  }
}

export class ReauthenticationRequiredError extends AppError {
  constructor(message = 'Recent authentication required. Please sign in again before proceeding.') {
    super(message, 428, 'REAUTHENTICATION_REQUIRED');
  }
}
