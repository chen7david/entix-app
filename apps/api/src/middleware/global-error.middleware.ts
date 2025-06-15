import { ExpressErrorMiddlewareInterface, Middleware } from 'routing-controllers';
import { Request, Response, NextFunction } from 'express';
import { toAppError } from '@utils/error.util';
import { Injectable } from '@utils/typedi.util';
import { ApiError, ErrorResponse } from '@repo/api-errors';
import { LoggerService } from '@services/logger.service';

@Middleware({ type: 'after' })
@Injectable()
export class ErrorHandlerMiddleware implements ExpressErrorMiddlewareInterface {
  private readonly logger: LoggerService;

  constructor(private readonly loggerService: LoggerService) {
    this.logger = this.loggerService.child({
      module: 'GlobalErrorHandlerMiddleware',
    });
  }

  error(error: unknown, request: Request, response: Response, _next: NextFunction): void {
    const appError = toAppError(error);

    this.logError(appError, request);

    const errorResponse: ErrorResponse = appError.toResponse();
    response.status(appError.status).json(errorResponse);
  }

  private logError(error: ApiError, request: Request): void {
    const context = {
      url: request.url,
      method: request.method,
      errorId: error.errorId,
      errorType: error.type,
      status: error.status,
      ...error.logContext,
    };

    if (error.status >= 500) {
      this.logger.error(error.message, context);
    } else if (error.status >= 400) {
      this.logger.warn(error.message, context);
    } else {
      this.logger.info(error.message, context);
    }

    if (error.stack) {
      this.logger.error('Stack trace', { stack: error.stack, ...context });
    }
  }
}
