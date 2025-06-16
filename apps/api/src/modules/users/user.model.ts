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
