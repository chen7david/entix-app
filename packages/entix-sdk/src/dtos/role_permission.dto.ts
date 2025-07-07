import { z } from 'zod';
import { Permission } from '@models/permission.model';
import { Role } from '@models/role.model';
import { createRolePermissionSchema, rolePermissionIdsSchema } from '@schemas/role_permission.schema';

export type CreateRolePermissionParamsDto = z.infer<typeof createRolePermissionSchema>;
export type RolePermissionIdsDto = z.infer<typeof rolePermissionIdsSchema>;

/**
 * DTO for retrieving all permissions for a role
 */
export type GetRolePermissionsResultDto = Permission[];

/**
 * DTO for retrieving all roles for a permission
 */
export type GetPermissionRolesResultDto = Role[];
