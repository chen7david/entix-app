import { InternalError, ConflictError, BadRequestError } from '../index';
import { ApiError } from '../error.model';

type PgError = {
  code?: string;
  detail?: string;
  cause?: unknown;
};

/**
 * Checks if the error is a DrizzleQueryError
 */
export function isDrizzleError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    error.constructor?.name === 'DrizzleQueryError' &&
    'query' in error &&
    'params' in error &&
    typeof (error as any).query === 'string'
  );
}

/**
 * Type guard to check if an object has a Postgres-style detail string
 */
function hasPgDetail(obj: unknown): obj is { detail: string } {
  return typeof obj === 'object' && obj !== null && 'detail' in obj && typeof (obj as any).detail === 'string';
}

/**
 * Extracts the Postgres error code from the error or its cause
 */
function getPgErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const pgError = error as PgError;
  if (pgError.code) return pgError.code;

  if (pgError.cause && typeof pgError.cause === 'object') {
    const cause = pgError.cause as PgError;
    return cause.code;
  }

  return undefined;
}

/**
 * Creates a ConflictError from a unique constraint violation
 */
export function fromUniqueConstraintViolation(error: unknown): ConflictError {
  const cause = (error as PgError).cause || error;
  let message = 'Resource already exists';

  if (hasPgDetail(cause)) {
    const match = cause.detail.match(/\(([^)]+)\)=\(([^)]+)\)/);
    if (match) {
      message = `Resource with ${match[1]} "${match[2]}" already exists`;
    }
  }

  return new ConflictError(message);
}

/**
 * Creates a BadRequestError from a foreign key violation
 */
export function fromForeignKeyViolation(error: unknown): BadRequestError {
  const cause = (error as PgError).cause || error;
  let message = 'Invalid reference: foreign key constraint failed';

  if (hasPgDetail(cause)) {
    const match = cause.detail.match(/\(([^)]+)\)=\(([^)]+)\)/);
    if (match) {
      message = `Invalid ${match[1]}: "${match[2]}" does not exist`;
    }
  }

  return new BadRequestError(message);
}

/**
 * Converts a Drizzle ORM error to an ApiError
 */
export function fromDrizzleError(error: unknown): ApiError {
  if (!isDrizzleError(error)) {
    return new InternalError('Not a Drizzle error');
  }

  const code = getPgErrorCode(error);

  switch (code) {
    case '23505': // Unique constraint violation
      return fromUniqueConstraintViolation(error);
    case '23503': // Foreign key violation
      return fromForeignKeyViolation(error);
    default:
      const message = error instanceof Error ? error.message : String(error);
      return new InternalError({ message, cause: error as Error });
  }
}
