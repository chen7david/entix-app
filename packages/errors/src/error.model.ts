import { HTTP_ERROR_MESSAGES } from './error.constant';
import { ApiErrorCode, ApiErrorOptions, ErrorDetail, ErrorResponse } from './error.type';
import { v4 as uuidv4 } from 'uuid';

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
  readonly code: ApiErrorCode;

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
    this.errorId = uuidv4();
    this.cause = options.cause;
    this.details = options.details || [];
    this.logContext = options.logContext || {};
    this.expose = options.expose !== undefined ? options.expose : status < 500;
    this.type = this.constructor.name.replace(/Error$/, '').toLowerCase();
    this.code = options.code || ApiError.getDefaultCodeForStatus(status);

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
   * Maps HTTP status codes to default error codes
   */
  private static getDefaultCodeForStatus(status: number): ApiErrorCode {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'UNPROCESSABLE_ENTITY';
      case 429:
        return 'TOO_MANY_REQUESTS';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 502:
        return 'BAD_GATEWAY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      case 504:
        return 'GATEWAY_TIMEOUT';
      default:
        return status >= 400 && status < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR';
    }
  }

  /**
   * Converts the error to a client-safe response object
   */
  toResponse(): ErrorResponse {
    const errorResponse: ErrorResponse = {
      status: this.status,
      type: this.type,
      code: this.code,
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
      code: this.code,
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
