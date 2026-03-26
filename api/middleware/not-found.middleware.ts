import type { Context } from 'hono';

export const notFoundHandler = (ctx: Context) => {
    return ctx.json({
        success: false,
        message: `Route ${ctx.req.path} not found`,
    }, 404);
};