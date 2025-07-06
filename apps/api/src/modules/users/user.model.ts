import { UserRole } from '@modules/user_roles/user_role.model';
import { users } from '../../database/schemas/user.schema';
import { Role } from '@repo/entix-sdk';

// Database layer types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserUpdate = Partial<Omit<NewUser, 'id'>>;

// Service layer types
export type CreateUserParams = {
  sub: string;
  email: string;
  username: string;
};

export type CreateUserResult = User;

export type FindUserByIdParams = {
  id: string;
};

export type FindUserByIdResult = User | undefined;

export type FindUserByCognitoSubParams = {
  sub: string;
};

export type FindUserByCognitoSubResult = User | undefined;

export type FindAllUsersResult = User[];

// User role related types
export type CreateUserRoleParams = {
  userId: string;
  roleId: string;
};

export type CreateUserRoleResult = UserRole;

export type FindUserRolesParams = {
  userId: string;
};

export type FindUserRolesResult = Role[];

export type FindUserPermissionsParams = {
  userId: string;
};

export type FindUserPermissionsResult = number[];
