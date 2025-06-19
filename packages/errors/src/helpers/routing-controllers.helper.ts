import { ApiError, UnauthorizedError, NotFoundError, BadRequestError, ForbiddenError } from '../index';

/**
 * Checks if the error is from routing-controllers
 */
export function isRoutingControllersError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  // Check for HttpError
  const isHttpError =
    'httpCode' in (error as any) &&
    typeof (error as any).httpCode === 'number' &&
    'name' in (error as any) &&
    (error as any).name === 'HttpError';

  // Check for NotFoundError
  const isNotFoundError =
    'name' in (error as any) && (error as any).name === 'NotFoundError' && 'message' in (error as any);

  // Check for AuthorizationRequiredError
  const isAuthError =
    'httpCode' in (error as any) &&
    (error as any).httpCode === 401 &&
    'message' in (error as any) &&
    typeof (error as any).message === 'string' &&
    (error as any).message.includes('Authorization is required');

  return isHttpError || isNotFoundError || isAuthError;
}

/**
 * Converts a routing-controllers error to an ApiError
 */
export function fromRoutingControllersError(error: unknown): ApiError {
  if (!isRoutingControllersError(error)) {
    throw new Error('Not a routing-controllers error');
  }

  const httpError = error as any;

  // Handle NotFoundError specifically
  if (httpError.name === 'NotFoundError') {
    return new NotFoundError(httpError.message || 'Resource not found');
  }

  // Handle HttpError
  const status = httpError.httpCode;
  const message = httpError.message || 'Unknown error';

  switch (status) {
    case 400:
      return new BadRequestError(message);
    case 401:
      return new UnauthorizedError(message);
    case 403:
      return new ForbiddenError(message);
    case 404:
      return new NotFoundError(message);
    default:
      // For other status codes, create an error with the same status
      return new UnauthorizedError(message);
  }
}
