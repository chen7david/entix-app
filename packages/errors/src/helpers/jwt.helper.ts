import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import { ApiError } from '../error.model';
import { UnauthorizedError, InternalError } from '../index';

export function fromJwtError(error: unknown): ApiError {
  if (error instanceof TokenExpiredError) {
    return new UnauthorizedError('Token expired');
  }
  if (error instanceof NotBeforeError) {
    return new UnauthorizedError('Token not active yet');
  }
  if (error instanceof JsonWebTokenError) {
    return new UnauthorizedError('Invalid token');
  }
  return new InternalError('An unknown error occurred');
}

export function isJwtError(error: unknown): error is JsonWebTokenError {
  return error instanceof JsonWebTokenError || error instanceof TokenExpiredError || error instanceof NotBeforeError;
}
