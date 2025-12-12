import { zValidator } from '@hono/zod-validator';
import type { ZodObject } from 'zod';
import type { ValidationTargets } from 'hono';

export const validator = <T extends ZodObject>(target: keyof ValidationTargets, schema: T) =>
    zValidator(target, schema, (result) => {
        if (!result.success) throw result.error;
    });

