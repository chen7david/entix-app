import { ServiceException } from '@smithy/smithy-client';
import { ApiError } from '../error.model';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
} from '../index';

export function fromCognitoError(error: ServiceException): ApiError {
  switch (error.name) {
    case 'UsernameExistsException':
      return new ConflictError({
        message: 'A user with that username already exists.',
        code: 'CONFLICT',
      });
    case 'UserNotFoundException':
      return new NotFoundError({
        message: 'User not found.',
        code: 'NOT_FOUND',
      });
    case 'NotAuthorizedException':
      return new UnauthorizedError({
        message: 'Incorrect username or password.',
        code: 'INVALID_CREDENTIALS',
      });
    case 'InvalidPasswordException':
      return new BadRequestError({
        message:
          'Invalid password format. Your password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.',
        code: 'INVALID_PASSWORD',
      });
    case 'CodeMismatchException':
      return new BadRequestError({
        message: 'Invalid verification code.',
        code: 'BAD_REQUEST',
      });
    case 'LimitExceededException':
      return new RateLimitError({
        message: 'Attempt limit exceeded, please try again later.',
        code: 'TOO_MANY_REQUESTS',
      });
    case 'UserNotConfirmedException':
      return new ForbiddenError({
        message: 'User account is not confirmed.',
        code: 'FORBIDDEN',
      });
    case 'InvalidParameterException':
      if (error.message?.includes('already confirmed')) {
        return new BadRequestError({
          message: 'User is already confirmed.',
          code: 'BAD_REQUEST',
        });
      }
      return new BadRequestError({
        message: error.message || 'Invalid parameter.',
        code: 'BAD_REQUEST',
      });
    default:
      return new InternalError({
        message: 'An unexpected Cognito error occurred.',
        cause: new Error(error.name),
        logContext: { cognitoErrorName: error.name },
        code: 'INTERNAL_SERVER_ERROR',
      });
  }
}

export function isCognitoError(error: unknown): error is ServiceException {
  return error instanceof Error && 'name' in error && '$metadata' in error;
}
