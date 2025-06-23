import { ApiError, UnauthorizedError, NotFoundError, BadRequestError, ForbiddenError } from '../index';

interface HttpError {
  name?: string;
  httpCode?: number;
  message?: string;
}

function isHttpErrorLike(error: unknown): error is HttpError {
  return typeof error === 'object' && error !== null && ('httpCode' in error || 'name' in error || 'message' in error);
}

/**
 * Converts a routing-controllers error to an ApiError
 */
export function fromRoutingControllersError(error: unknown): ApiError {
  if (!isHttpErrorLike(error)) {
    return new UnauthorizedError('Unknown routing error');
  }

  if (error.name === 'NotFoundError') {
    return new NotFoundError(error.message || 'Resource not found');
  }

  const statusCode = error.httpCode;
  const errorMessage = error.message || 'Unknown error';

  switch (statusCode) {
    case 400:
      return new BadRequestError(errorMessage);
    case 401:
      return new UnauthorizedError(errorMessage);
    case 403:
      return new ForbiddenError(errorMessage);
    case 404:
      return new NotFoundError(errorMessage);
    default:
      return new UnauthorizedError(errorMessage);
  }
}
