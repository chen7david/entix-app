import { z } from 'zod';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';

export type CreateUserDto = z.infer<typeof createUserSchema>;

export type CreateUserResultDto = {
  id: string;
  email: string;
  username: string;
  sub: string;
};

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export type UpdateUserResultDto = {
  id: string;
  email: string;
  username: string;
  sub: string;
};
