/**
 * Details about a specific error
 */
export type ErrorDetail = {
  path: string | string[];
  message: string;
  [key: string]: unknown;
};

/**
 * Response format for errors returned to clients
 */
export type ErrorResponse = {
  status: number;
  message: string;
  type: string;
  errorId?: string;
  details?: ErrorDetail[];
  stack?: string;
  context?: Record<string, unknown>;
  code?: ApiErrorCode;
};

/**
 * Configuration options for creating an AppError
 */
export type ApiErrorOptions = {
  message?: string;
  status?: number;
  cause?: Error;
  details?: ErrorDetail[];
  logContext?: Record<string, unknown>;
  expose?: boolean;
  code?: ApiErrorCode;
};

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_REFRESH_TOKEN'
  | 'INVALID_ACCESS_TOKEN'
  | 'INVALID_TOKEN'
  | 'INVALID_USER'
  | 'INVALID_PASSWORD'
  | 'INVALID_EMAIL'
  | 'INVALID_USERNAME'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_SERVER_ERROR'
  | 'BAD_GATEWAY'
  | 'SERVICE_UNAVAILABLE'
  | 'GATEWAY_TIMEOUT';
