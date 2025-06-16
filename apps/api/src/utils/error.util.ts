import { fromPostgresError, isPostgresError, isPostgresUniqueError } from '@repo/api-errors/helpers/pg';
import { fromCognitoError, isCognitoError } from '@repo/api-errors/helpers/aws';
import { fromZodError, isZodError } from '@repo/api-errors/helpers/zod';
import { fromJwtError, isJwtError } from '@repo/api-errors/helpers/jwt';
import { ApiError, InternalError, isApiError, UnauthorizedError } from '@repo/api-errors';
import { HttpError } from 'routing-controllers';

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

  if (isJwtError(error)) {
    return fromJwtError(error);
  }

  if (error instanceof HttpError) {
    return new UnauthorizedError(error.message);
  }

  if (error instanceof Error) {
    return new InternalError({ message: error.message, cause: error });
  }

  return new InternalError({
    message: 'An unknown error occurred',
    cause: error as Error,
  });
}
