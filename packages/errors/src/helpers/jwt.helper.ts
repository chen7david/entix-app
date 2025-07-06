import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import { ApiError } from '../error.model';
import { UnauthorizedError, InternalError } from '../index';

export function fromJwtError(error: unknown): ApiError {
  if (error instanceof TokenExpiredError) {
    return new UnauthorizedError({
      message: 'Token expired',
      code: 'INVALID_TOKEN',
    });
  }
  if (error instanceof NotBeforeError) {
    return new UnauthorizedError({
      message: 'Token not active yet',
      code: 'INVALID_TOKEN',
    });
  }
  if (error instanceof JsonWebTokenError) {
    return new UnauthorizedError({
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }
  return new InternalError({
    message: 'An unknown error occurred',
    code: 'INTERNAL_SERVER_ERROR',
  });
}

export function isJwtError(error: unknown): error is JsonWebTokenError | TokenExpiredError | NotBeforeError {
  return error instanceof JsonWebTokenError || error instanceof TokenExpiredError || error instanceof NotBeforeError;
}
