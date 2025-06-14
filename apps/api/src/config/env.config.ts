import { z } from '@utils/zod.util';

export const envSchema = z.object({
  PORT: z.coerce.number(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export type EnvSchema = z.infer<typeof envSchema>;
