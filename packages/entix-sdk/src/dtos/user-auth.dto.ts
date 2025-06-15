import { z } from 'zod';
import { loginSchema, signUpSchema } from '../schemas/user-auth.schema';

export type SignUpDto = z.infer<typeof signUpSchema>;

export type SignUpResultDto = {
  id: string;
  email: string;
  username: string;
  sub: string;
};

export type LoginDto = z.infer<typeof loginSchema>;

export type LoginResultDto = {
  id: string;
  email: string;
  username: string;
  sub: string;
};
