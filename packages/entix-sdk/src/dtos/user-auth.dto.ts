import { z } from 'zod';
import {
  changePasswordSchema,
  confirmForgotPasswordSchema,
  confirmSignUpSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
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

export type ConfirmSignUpResultDto = {
  success: boolean;
};

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

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export type ForgotPasswordResultDto = {
  deliveryMedium: string;
  method: string;
  destination: string;
};

export type ConfirmForgotPasswordDto = z.infer<typeof confirmForgotPasswordSchema>;

export type ConfirmForgotPasswordResultDto = {
  success: boolean;
};

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export type ChangePasswordResultDto = {
  success: boolean;
};

export type LogoutDto = z.infer<typeof logoutSchema>;

export type LogoutResultDto = {
  success: boolean;
};
