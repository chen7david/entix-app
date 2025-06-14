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
      return new ConflictError('A user with that username already exists.');
    case 'UserNotFoundException':
      return new NotFoundError('User not found.');
    case 'NotAuthorizedException':
      return new UnauthorizedError('Incorrect username or password.');
    case 'InvalidPasswordException':
      return new BadRequestError(
        'Invalid password format. Your password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.',
      );
    case 'CodeMismatchException':
      return new BadRequestError('Invalid verification code.');
    case 'LimitExceededException':
      return new RateLimitError('Attempt limit exceeded, please try again later.');
    case 'UserNotConfirmedException':
      return new ForbiddenError('User account is not confirmed.');
    default:
      return new InternalError({
        message: 'An unexpected Cognito error occurred.',
        cause: new Error(error.name),
        logContext: { cognitoErrorName: error.name },
      });
  }
}

export function isCognitoError(error: unknown): error is ServiceException {
  return error instanceof Error && 'name' in error && '$metadata' in error;
}
