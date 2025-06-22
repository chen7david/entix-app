import type { z, ZodTypeAny } from 'zod';

export function getValidatedEnv<T extends ZodTypeAny>(schema: T): z.infer<T> {
  const result = schema.safeParse(import.meta.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Environment variable validation failed.');
  }

  return result.data;
}
