import { Context } from 'hono';

export const notFoundHandler = async (c: Context) => {
    return c.json(
        {
            success: false,
            message: `Route ${c.req.path} not found`,
        },
        404
    );
};