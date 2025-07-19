import { z } from '@utils/zod.util';

export const envSchema = z.object({
  // API
  APP_PORT: z.coerce.number(),
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  NEW_RELIC_ENABLED: z.coerce.boolean(),

  // Postgres DB
  DATABASE_URL: z.string(),

  // AWS
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_COGNITO_USER_POOL_ID: z.string(),
  AWS_COGNITO_USER_POOL_CLIENT_ID: z.string(),

  // JWT
  JWT_ACCESS_TOKEN_SECRET: z.string(),
  JWT_REFRESH_TOKEN_SECRET: z.string(),
  JWT_ACCESS_TOKEN_EXPIRATION_TIME: z.string(),
  JWT_REFRESH_TOKEN_EXPIRATION_TIME: z.string(),
});

export type EnvResult = z.infer<typeof envSchema>;
