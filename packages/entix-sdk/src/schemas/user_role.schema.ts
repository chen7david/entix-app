import { z } from 'zod';

export const createUserRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

export const deleteUserRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});
