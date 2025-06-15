import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Creates a middleware that validates a specific part of the request
 */
function createValidationMiddleware<T extends ZodSchema>(schema: T, source: 'body' | 'params' | 'query' | 'headers') {
  return function (req: Request, _res: Response, next: NextFunction): void {
    try {
      const validated = schema.parse(req[source]);

      // Only mutate the request if not headers
      if (source !== 'headers') {
        (req[source] as Record<string, unknown>) = validated as Record<string, unknown>;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateBody<T extends ZodSchema>(schema: T) {
  return createValidationMiddleware(schema, 'body');
}

export function validateParams<T extends ZodSchema>(schema: T) {
  return createValidationMiddleware(schema, 'params');
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return createValidationMiddleware(schema, 'query');
}

export function validateHeaders<T extends ZodSchema>(schema: T) {
  return createValidationMiddleware(schema, 'headers');
}
