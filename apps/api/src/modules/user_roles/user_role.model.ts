import { userRoles } from '../../database/schemas/user_role.shema';

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type UserRoleUpdate = Partial<Omit<NewUserRole, 'id'>>;

export type DeleteUserRoleParams = {
  userId: string;
  roleId: string;
};
