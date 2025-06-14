import { z } from '@utils/zod.util';

export const envSchema = z.object({
  PORT: z.coerce.number(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export type EnvResult = z.infer<typeof envSchema>;
