import { z } from 'zod';

export const createRolePermissionSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
});

export const rolePermissionIdsSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
});
