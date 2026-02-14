import { Context } from 'hono';
import { ZodError } from 'zod';
import { HTTPException } from 'hono/http-exception';
import { AppError } from '../errors/app.error';
import { z } from 'zod';

export const globalErrorHandler = async (err: Error, c: Context) => {
    console.error('Caught error:', err);

    // 1. Zod validation error
    if (err instanceof ZodError) {
        const flattened = z.treeifyError(err);
        console.log('Flattened Zod error:', flattened);
        return c.json(
            {
                success: false,
                message: 'Validation failed',
                details: 'properties' in flattened ? flattened.properties : flattened,
            },
            { status: 400 }
        );
    }

    // 2. HTTPException from Hono
    if (err instanceof HTTPException) {
        return c.json(
            {
                success: false,
                message: err.message,
            },
            { status: err.status }
        );
    }

    // 3. Custom AppError
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

    // 4. Unknown or unhandled error
    return c.json(
        {
            success: false,
            message: 'Internal Server Error',
        },
        500
    );
};