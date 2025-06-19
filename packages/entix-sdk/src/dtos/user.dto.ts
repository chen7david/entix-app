import { createUserSchema, updateUserSchema } from '@schemas/user.schema';
import { User } from '@models/user.model';
import { Role } from '@models/role.model';
import { z } from 'zod';

export type GetUserResultDto = User;

export type GetUsersResultDto = User[];

export type CreateUserDto = z.infer<typeof createUserSchema>;

export type CreateUserResultDto = User;

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export type UpdateUserResultDto = User;

export type GetUserRolesResultDto = Role[];
