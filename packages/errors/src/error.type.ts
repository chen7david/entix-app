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
};

/**
 * Configuration options for creating an AppError
 */
export type ApiErrorOptions = {
  /**
   * Error message
   */
  message?: string;

  /**
   * HTTP status code
   */
  status?: number;

  /**
   * Original error that caused this error
   */
  cause?: Error;

  /**
   * Detailed information about the error
   */
  details?: ErrorDetail[];

  /**
   * Additional context information for logging
   */
  logContext?: Record<string, unknown>;

  /**
   * Whether to expose the error message to clients
   * Defaults to true for 4xx errors and false for 5xx errors
   */
  expose?: boolean;
};
