import type { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { ZodSchema } from 'zod';

export const zodValidator = <T extends ZodSchema>(target: 'json' | 'query' | 'param' | 'form', schema: T) =>
    zValidator(target, schema, (result, c: Context) => {
        if (!result.success) throw result.error;
    });

