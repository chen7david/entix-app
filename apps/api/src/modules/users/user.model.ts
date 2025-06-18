import { UserRole } from '@modules/user_roles/user_role.model';
import { users } from './user.schema';

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserUpdate = Partial<Omit<NewUser, 'id'>>;

export type CreateUserParams = {
  sub: string;
  email: string;
  username: string;
};

export type CreateUserResult = User;

export type CreateUserRoleParams = {
  userId: string;
  roleId: string;
};

export type CreateUserRoleResult = UserRole;
