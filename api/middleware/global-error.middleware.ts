import { Context } from 'hono';
import { ZodError } from 'zod';
import { AppError } from '../errors/app.error';
import { z } from 'zod';

export const globalErrorHandler = async (err: Error, c: Context) => {
    const logger = c.get('logger');
    logger.error({ err }, 'Caught error');

    // 1. Zod validation error
    if (err instanceof ZodError) {
        const flattened = z.treeifyError(err);
        logger.info({ flattened }, 'Flattened Zod error');
        return c.json(
            {
                success: false,
                message: 'Validation failed',
                details: 'properties' in flattened ? flattened.properties : flattened,
            },
            { status: 400 }
        );
    }

    // 2. Custom AppError
    if (err instanceof AppError) {
        return c.json(
            {
                success: false,
                message: err.message,
                ...(err.details ? { details: err.details } : {}),
            },
            err.status
        );
    }

    // 3. Unknown or unhandled error
    return c.json(
        {
            success: false,
            message: 'Internal Server Error',
        },
        500
    );
};