import { z } from 'zod';
import {
  confirmSignUpSchema,
  loginSchema,
  resendConfirmationCodeSchema,
  signUpSchema,
} from '../schemas/user-auth.schema';

export type SignUpDto = z.infer<typeof signUpSchema>;

export type SignUpResultDto = {
  id: string;
  email: string;
  username: string;
  sub: string;
};

export type LoginDto = z.infer<typeof loginSchema>;

export type ResendConfirmationCodeDto = z.infer<typeof resendConfirmationCodeSchema>;

export type ConfirmSignUpDto = z.infer<typeof confirmSignUpSchema>;

export type LoginResultDto = {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  refreshToken: string;
  idToken: string;
};

export type ResendConfirmationCodeResultDto = {
  deliveryMedium: string;
  method: string;
  destination: string;
};
