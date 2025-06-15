import { fromCognitoError, isCognitoError } from '@repo/api-errors/helpers/aws';
import { fromPostgresError, isPostgresError, isPostgresUniqueError } from '@repo/api-errors/helpers/pg';
import { fromZodError, isZodError } from '@repo/api-errors/helpers/zod';
import { ApiError, InternalError, isApiError } from '@repo/api-errors';

export function toAppError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (isZodError(error)) {
    return fromZodError(error);
  }

  if (isCognitoError(error)) {
    return fromCognitoError(error);
  }

  if (isPostgresError(error) && isPostgresUniqueError(error)) {
    return fromPostgresError(error);
  }

  if (error instanceof Error) {
    return new InternalError({ message: error.message, cause: error });
  }

  return new InternalError({
    message: 'An unknown error occurred',
    cause: error as Error,
  });
}
