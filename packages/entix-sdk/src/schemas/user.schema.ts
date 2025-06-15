import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  invitationCode: z.string().length(6),
});

export const updateUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});
