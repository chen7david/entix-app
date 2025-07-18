import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
});

export const updateRoleSchema = z.object({
  description: z.string().optional(),
});
