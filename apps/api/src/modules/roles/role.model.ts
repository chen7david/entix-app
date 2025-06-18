import { roles } from './role.shema';

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type RoleUpdate = Partial<Omit<NewRole, 'id'>>;

export type CreateRoleParams = {
  name: string;
  description?: string;
};

export type CreateRoleResult = Role;
