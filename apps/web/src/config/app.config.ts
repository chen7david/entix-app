import { z } from 'zod';
import { getValidatedEnv } from '@helpers/config.helper';

export const appConfigSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_ACCESS_TOKEN_KEY: z.string().default('entix_access_token'),
  VITE_REFRESH_TOKEN_KEY: z.string().default('entix_refresh_token'),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export const appConfig = getValidatedEnv(appConfigSchema);
