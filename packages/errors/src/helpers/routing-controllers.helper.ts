import { ApiError, UnauthorizedError, NotFoundError, BadRequestError, ForbiddenError } from '../index';

/**
 * Converts a routing-controllers error to an ApiError
 */
export function fromRoutingControllersError(error: unknown): ApiError {
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
