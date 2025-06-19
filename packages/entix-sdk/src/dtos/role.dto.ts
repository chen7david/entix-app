import { User } from '@models/user.model';
import { Role } from '@models/role.model';
import { createRoleSchema, updateRoleSchema } from '@schemas/role.schema';
import { z } from 'zod';

/**
 * DTO for retrieving all roles
 */
export type GetRolesResultDto = Role[];

/**
 * DTO for retrieving a role by ID
 */
export type GetRoleResultDto = Role;

/**
 * DTO for creating a role
 */
export type CreateRoleParamsDto = z.infer<typeof createRoleSchema>;

/**
 * DTO for the result of creating a role
 */
export type CreateRoleResultDto = Role;

/**
 * DTO for updating a role
 */
export type UpdateRoleParamsDto = z.infer<typeof updateRoleSchema>;

/**
 * DTO for the result of updating a role
 */
export type UpdateRoleResultDto = Role;

/**
 * DTO for retrieving users assigned to a role
 */
export type GetRoleUsersResultDto = User[];
