import { createUserRoleSchema, deleteUserRoleSchema } from '@schemas/user_role.schema';
import { z } from 'zod';

export type CreateUserRoleDto = z.infer<typeof createUserRoleSchema>;

export type DeleteUserRoleDto = z.infer<typeof deleteUserRoleSchema>;
