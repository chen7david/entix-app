import { HTTP_ERROR_MESSAGES } from './error.constant';
import { ApiErrorOptions, ErrorDetail, ErrorResponse } from './error.type';
import { randomUUID } from 'crypto';

/**
 * Environment configuration for error handling
 * Set once at application startup for better performance
 */
export class ErrorConfig {
  private static _isDevelopment = false;

  static get isDevelopment(): boolean {
    return this._isDevelopment;
  }

  static setDevelopmentMode(isDev: boolean): void {
    this._isDevelopment = isDev;
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly errorId: string;
  readonly cause?: Error;
  readonly details: ErrorDetail[];
  readonly logContext: Record<string, unknown>;
  readonly type: string;
  readonly expose: boolean;

  /**
   * Create a BaseError with a message or options object.
   * @param params Error message string or options object
   */
  constructor(message: string);
  constructor(options: ApiErrorOptions);
  constructor(params: string | ApiErrorOptions) {
    const options = ApiError.normalizeOptions(params);
    const status = options.status || 500;
    const message = options.message || HTTP_ERROR_MESSAGES[status] || 'Unknown Error';

    super(message);
    this.status = status;
    this.errorId = randomUUID();
    this.cause = options.cause;
    this.details = options.details || [];
    this.logContext = options.logContext || {};
    this.expose = options.expose !== undefined ? options.expose : status < 500;
    this.type = this.constructor.name.replace(/Error$/, '').toLowerCase();

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }

  /**
   * Normalize constructor parameters into options object
   */
  private static normalizeOptions(messageOrOptions: string | ApiErrorOptions): ApiErrorOptions {
    if (typeof messageOrOptions === 'string') {
      return { message: messageOrOptions };
    }
    return messageOrOptions ?? {};
  }

  /**
   * Converts the error to a client-safe response object
   */
  toResponse(): ErrorResponse {
    const errorResponse: ErrorResponse = {
      status: this.status,
      type: this.type,
      message: this.expose ? this.message : HTTP_ERROR_MESSAGES[this.status] || 'Internal Server Error',
    };

    // Include errorId for 500-level errors to help with debugging
    if (this.status >= 500) {
      errorResponse.errorId = this.errorId;
    }

    // Include details only for exposed errors
    if (this.expose && this.details.length > 0) {
      errorResponse.details = this.details;
    }
    // Include stack trace only in development mode
    if (ErrorConfig.isDevelopment) {
      errorResponse.stack = this.stack;
      errorResponse.context = this.logContext;
    }

    return errorResponse;
  }

  /**
   * Serializes the error to JSON, including stack trace in development mode
   */
  toJSON(): Record<string, unknown> {
    const errorJson: Record<string, unknown> = {
      message: this.message,
      status: this.status,
      errorId: this.errorId,
      type: this.type,
      details: this.details,
    };

    // Include stack trace only in development mode
    if (ErrorConfig.isDevelopment) {
      errorJson.stack = this.stack;
      errorJson.context = this.logContext;
    }

    return errorJson;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
