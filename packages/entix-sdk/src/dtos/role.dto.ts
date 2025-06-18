import { User } from '@models/user.model';
import { Role } from '@models/role.model';
import { createRoleSchema, updateRoleSchema } from '@schemas/role.schema';
import { z } from 'zod';

export type GetRolesResultDto = Role[];

export type CreateRoleDto = z.infer<typeof createRoleSchema>;

export type CreateRoleResultDto = Role;

export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;

export type UpdateRoleResultDto = Role;

export type GetRoleUsersResultDto = User[];
