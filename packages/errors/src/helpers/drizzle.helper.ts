import { InternalError, ConflictError } from '../index';
import { ApiError } from '../error.model';

/**
 * Checks if the error is a DrizzleQueryError
 */
export function isDrizzleError(error: unknown): boolean {
  // DrizzleQueryError has these specific properties
  return (
    typeof error === 'object' &&
    error !== null &&
    error.constructor?.name === 'DrizzleQueryError' &&
    'query' in (error as any) &&
    'params' in (error as any) &&
    typeof (error as any).query === 'string'
  );
}

/**
 * Checks if the error or its cause is a PostgreSQL unique constraint violation
 */
export function isUniqueConstraintViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  // Check if the error itself has the code
  if ('code' in error && (error as any).code === '23505') return true;

  // Check if the error has a cause with the code
  if ('cause' in error && (error as any).cause) {
    const cause = (error as any).cause;
    if (typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === '23505') {
      return true;
    }
  }

  return false;
}

/**
 * Creates a ConflictError from a unique constraint violation
 */
export function fromUniqueConstraintViolation(error: unknown): ConflictError {
  const cause = (error as any).cause || error;
  let message = 'Resource already exists';

  // Try to extract field name from error detail
  if (cause.detail && typeof cause.detail === 'string') {
    const match = cause.detail.match(/\(([^)]+)\)=\(([^)]+)\)/);
    if (match) {
      message = `Resource with ${match[1]} "${match[2]}" already exists`;
    }
  }

  return new ConflictError(message);
}

/**
 * Converts a Drizzle ORM error to an ApiError
 */
export function fromDrizzleError(error: unknown): ApiError {
  if (!isDrizzleError(error)) {
    return new InternalError('Not a Drizzle error');
  }

  // If it's a unique constraint violation, convert to a ConflictError
  if (isUniqueConstraintViolation(error)) {
    return fromUniqueConstraintViolation(error);
  }

  // Default to internal error for other Drizzle errors
  const message = error instanceof Error ? error.message : String(error);
  return new InternalError({ message, cause: error as Error });
}
