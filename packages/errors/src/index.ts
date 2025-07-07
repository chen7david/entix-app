export * from './error.model';
export * from './error.type';
import { ApiError } from './error.model';
import { ApiErrorCode, ApiErrorOptions } from './error.type';

export class NotFoundError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 404, message: arg, code: 'NOT_FOUND' });
    } else {
      super({ status: 404, code: 'NOT_FOUND', ...arg });
    }
  }
}

export class BadRequestError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 400, message: arg, code: 'BAD_REQUEST' });
    } else {
      super({ status: 400, code: 'BAD_REQUEST', ...arg });
    }
  }
}

export class ValidationError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 422, message: arg, code: 'UNPROCESSABLE_ENTITY' });
    } else {
      super({ status: 422, code: 'UNPROCESSABLE_ENTITY', ...arg });
    }
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 401, message: arg, code: 'UNAUTHORIZED' });
    } else {
      super({ status: 401, code: 'UNAUTHORIZED', ...arg });
    }
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    const defaultMessage = 'Invalid username or password';
    if (typeof arg === 'string') {
      super({ message: arg || defaultMessage, code: 'INVALID_CREDENTIALS' });
    } else {
      super({ message: arg?.message || defaultMessage, code: 'INVALID_CREDENTIALS', ...arg });
    }
  }
}

export class ForbiddenError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 403, message: arg, code: 'FORBIDDEN' });
    } else {
      super({ status: 403, code: 'FORBIDDEN', ...arg });
    }
  }
}

export class ConflictError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 409, message: arg, code: 'CONFLICT' });
    } else {
      super({ status: 409, code: 'CONFLICT', ...arg });
    }
  }
}

export class ServiceError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 503, message: arg, expose: false, code: 'SERVICE_UNAVAILABLE' });
    } else {
      super({ status: 503, expose: false, code: 'SERVICE_UNAVAILABLE', ...arg });
    }
  }
}

export class InternalError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 500, message: arg, expose: false, code: 'INTERNAL_SERVER_ERROR' });
    } else {
      super({ status: 500, expose: false, code: 'INTERNAL_SERVER_ERROR', ...arg });
    }
  }
}

export class RateLimitError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 429, message: arg, code: 'TOO_MANY_REQUESTS' });
    } else {
      super({ status: 429, code: 'TOO_MANY_REQUESTS', ...arg });
    }
  }
}
