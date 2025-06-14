import { ApiError } from './error.model';
import { ApiErrorOptions } from './error.type';

export class NotFoundError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 404, message: arg });
    } else {
      super({ status: 404, ...arg });
    }
  }
}

export class BadRequestError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 400, message: arg });
    } else {
      super({ status: 400, ...arg });
    }
  }
}

export class ValidationError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 422, message: arg });
    } else {
      super({ status: 422, ...arg });
    }
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 401, message: arg });
    } else {
      super({ status: 401, ...arg });
    }
  }
}

export class ForbiddenError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 403, message: arg });
    } else {
      super({ status: 403, ...arg });
    }
  }
}

export class ConflictError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 409, message: arg });
    } else {
      super({ status: 409, ...arg });
    }
  }
}

export class ServiceError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 503, message: arg, expose: false });
    } else {
      super({ status: 503, expose: false, ...arg });
    }
  }
}

export class InternalError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 500, message: arg, expose: false });
    } else {
      super({ status: 500, expose: false, ...arg });
    }
  }
}

export class RateLimitError extends ApiError {
  constructor(message?: string);
  constructor(options?: ApiErrorOptions);
  constructor(arg?: string | ApiErrorOptions) {
    if (typeof arg === 'string') {
      super({ status: 429, message: arg });
    } else {
      super({ status: 429, ...arg });
    }
  }
}
