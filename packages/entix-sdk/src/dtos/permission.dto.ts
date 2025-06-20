import { z } from 'zod';
import { Permission } from '@models/permission.model';
import { createPermissionSchema, updatePermissionSchema } from '@schemas/permission.schema';

export type CreatePermissionParamsDto = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionParamsDto = z.infer<typeof updatePermissionSchema>;

/**
 * DTO for retrieving all permissions
 */
export type GetPermissionsResultDto = Permission[];

/**
 * DTO for retrieving a permission by ID
 */
export type GetPermissionResultDto = Permission;

/**
 * DTO for the result of creating a permission
 */
export type CreatePermissionResultDto = Permission;

/**
 * DTO for the result of updating a permission
 */
export type UpdatePermissionResultDto = Permission;
