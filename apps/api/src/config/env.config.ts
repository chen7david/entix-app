import { z } from '@utils/zod.util';

export const envSchema = z.object({
  PORT: z.coerce.number(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  NEW_RELIC_ENABLED: z.coerce.boolean(),
});

export type EnvResult = z.infer<typeof envSchema>;
