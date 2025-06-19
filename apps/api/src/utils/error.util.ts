import { ApiError, InternalError, isApiError } from '@repo/api-errors';
import { fromDrizzleError, isDrizzleError } from '@repo/api-errors/helpers/drizzle';
import { fromCognitoError, isCognitoError } from '@repo/api-errors/helpers/aws';
import { fromZodError, isZodError } from '@repo/api-errors/helpers/zod';
import { fromJwtError, isJwtError } from '@repo/api-errors/helpers/jwt';
import { isRoutingControllersError, fromRoutingControllersError } from '@repo/api-errors/helpers/routing-controllers';

/**
 * Converts any error to an ApiError for consistent error handling
 */
export function toAppError(error: unknown): ApiError {
  console.log({ rawError: error });
  // If it's already an ApiError, return it as is
  if (isApiError(error)) return error;

  // Check for other common error types
  if (isDrizzleError(error)) return fromDrizzleError(error);
  if (isZodError(error)) return fromZodError(error);
  if (isCognitoError(error)) return fromCognitoError(error);
  if (isJwtError(error)) return fromJwtError(error);
  if (isRoutingControllersError(error)) return fromRoutingControllersError(error);

  // Handle generic JS errors
  if (error instanceof Error) {
    return new InternalError({ message: error.message, cause: error });
  }

  // Fallback for unknown error types
  return new InternalError({
    message: 'An unknown error occurred',
    cause: error as Error,
  });
}
