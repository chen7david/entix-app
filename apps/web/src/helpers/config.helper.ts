import type { z, ZodTypeAny } from 'zod';

export function getValidatedEnv<T extends ZodTypeAny>(schema: T): z.infer<T> {
  const result = schema.safeParse(import.meta.env);

  if (!result.success) {
    throw new Error(`Invalid environment variables: ${JSON.stringify(result.error.format())}`);
  }

  return result.data;
}
