import { z } from 'zod';

export const createPermissionSchema = z.object({
  name: z.string().min(3),
  permissionCode: z.number().int().positive(),
  description: z.string().optional(),
});

export const updatePermissionSchema = z.object({
  name: z.string().min(3).optional(),
  permissionCode: z.number().int().positive().optional(),
  description: z.string().optional().nullable(),
});
