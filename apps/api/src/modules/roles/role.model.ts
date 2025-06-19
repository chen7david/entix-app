import { roles } from '../../database/schemas/role.schema';
import { User } from '@modules/users/user.model';

// Database layer types
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type RoleUpdate = Partial<Omit<NewRole, 'id'>>;

// Service layer types
export type CreateRoleParams = NewRole;
export type CreateRoleResult = Role;

export type UpdateRoleParams = RoleUpdate;
export type UpdateRoleResult = Role;

export type DeleteRoleParams = {
  id: string;
};
export type DeleteRoleResult = {
  success: boolean;
};

export type FindRoleByIdParams = {
  id: string;
};
export type FindRoleByIdResult = Role;

export type FindRoleByNameParams = {
  name: string;
};
export type FindRoleByNameResult = Role | undefined;

export type FindAllRolesResult = Role[];

export type FindRoleUsersParams = {
  roleId: string;
};
export type FindRoleUsersResult = User[];
