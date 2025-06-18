import { roles } from '../../database/schemas/role.schema';
import { IdParams } from '@repo/entix-sdk';

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type RoleUpdate = Partial<Omit<NewRole, 'id'>>;

export type CreateRoleParams = NewRole;

export type CreateRoleResult = Role;

export type UpdateRoleParams = RoleUpdate;

export type UpdateRoleResult = Role;

export type DeleteRoleParams = IdParams;

export type DeleteRoleResult = void;
