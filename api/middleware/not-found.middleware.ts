import { Context } from 'hono';
import { NotFoundError } from '../errors/app.error';

export const notFoundHandler = (c: Context) => {
    throw new NotFoundError(`Route ${c.req.path} not found`);
};