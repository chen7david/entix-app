import { Context } from 'hono';
import { NotFoundError } from '../errors/app.error';

export const notFoundHandler = (ctx: Context) => {
    throw new NotFoundError(`Route ${ctx.req.path} not found`);
};