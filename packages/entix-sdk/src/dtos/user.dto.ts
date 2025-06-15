import { z } from 'zod';
import { createUserSchema } from '../schemas/user.schema';

export type CreateUserDto = z.infer<typeof createUserSchema>;
