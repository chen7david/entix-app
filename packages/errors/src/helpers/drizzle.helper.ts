import { ConflictError, InternalError } from '../index';
import { ApiError } from '../error.model';
import { DatabaseError } from 'pg';
import { fromPostgresError } from './pg.helper';

/**
 * Checks if the error is a Drizzle ORM query error
 */
export function isDrizzleError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'query' in error &&
    'params' in error &&
    typeof (error as any).query === 'string'
  );
}

/**
 * Checks if the error is a Drizzle ORM query error with a PostgreSQL cause
 */
export function isDrizzlePostgresError(error: unknown): boolean {
  return (
    isDrizzleError(error) &&
    'cause' in (error as Record<string, unknown>) &&
    (error as Record<string, unknown>).cause !== null &&
    typeof (error as Record<string, unknown>).cause === 'object'
  );
}

/**
 * Converts a Drizzle ORM error to an ApiError
 */
export function fromDrizzleError(error: unknown): ApiError {
  if (!isDrizzleError(error)) {
    return new InternalError('Not a Drizzle error');
  }

  // If it has a cause that's a PostgreSQL error
  if (isDrizzlePostgresError(error)) {
    const cause = (error as Record<string, unknown>).cause;

    // Check for PostgreSQL unique constraint violation
    if (cause && typeof cause === 'object' && 'code' in (cause as object) && (cause as any).code === '23505') {
      return fromPostgresError(cause as DatabaseError);
    }
  }

  // Default to internal error for other Drizzle errors
  const message = error instanceof Error ? error.message : String(error);
  return new InternalError({ message, cause: error as Error });
}
