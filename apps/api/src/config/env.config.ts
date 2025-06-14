import { z } from '@utils/zod.util';

export const envSchema = z.object({
  PORT: z.coerce.number(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  NEW_RELIC_ENABLED: z.coerce.boolean(),
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_COGNITO_USER_POOL_ID: z.string(),
  AWS_COGNITO_USER_POOL_CLIENT_ID: z.string(),
});

export type EnvResult = z.infer<typeof envSchema>;
