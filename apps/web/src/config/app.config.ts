import { z } from 'zod';

export const appConfigSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_ACCESS_TOKEN_KEY: z.string().default('entix_access_token'),
  VITE_REFRESH_TOKEN_KEY: z.string().default('entix_refresh_token'),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export const appConfig = getValidatedEnv(appConfigSchema);

/**
 * Validates environment variables against a schema
 */
function getValidatedEnv<T extends z.ZodType>(schema: T): z.infer<T> {
  const env = import.meta.env;
  const result = schema.safeParse(env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return result.data;
}
