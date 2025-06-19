import { ZodError } from 'zod';
import { ValidationError } from '../index';
import { ErrorDetail } from '../error.type';

export const fromZodError = (zodError: ZodError, message = 'Validation failed'): ValidationError => {
  const details: ErrorDetail[] = zodError.errors.map(err => ({
    path: Array.isArray(err.path) ? err.path.map(p => String(p)) : String(err.path),
    message: err.message,
    code: err.code,
  }));
  return new ValidationError({ message, details, cause: zodError });
};

export function isZodError(error: unknown): error is ZodError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    Array.isArray((error as any).errors) &&
    (error as any).name === 'ZodError'
  );
}
