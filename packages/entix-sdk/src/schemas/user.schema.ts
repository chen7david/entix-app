import { z } from 'zod';

// TODO: Add schema for create user
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

export const verifySessionSchema = z
  .object({
    authorization: z.string().startsWith('Bearer '),
  })
  .transform(data => {
    return {
      accessToken: data.authorization.split(' ')[1],
    };
  });
