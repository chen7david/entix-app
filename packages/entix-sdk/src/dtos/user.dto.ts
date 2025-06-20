import { createUserSchema, updateUserSchema } from '@schemas/user.schema';
import { User } from '@models/user.model';
import { Role } from '@models/role.model';
import { z } from 'zod';

/**
 * DTO for retrieving a user by ID
 */
export type GetUserResultDto = User;

/**
 * DTO for retrieving all users
 */
export type GetUsersResultDto = User[];

/**
 * DTO for creating a user
 */
export type CreateUserParamsDto = z.infer<typeof createUserSchema>;

/**
 * DTO for the result of creating a user
 */
export type CreateUserResultDto = User;

/**
 * DTO for updating a user
 */
export type UpdateUserParamsDto = z.infer<typeof updateUserSchema>;

/**
 * DTO for the result of updating a user
 */
export type UpdateUserResultDto = User;

/**
 * DTO for retrieving a user's roles
 */
export type GetUserRolesResultDto = Role[];
