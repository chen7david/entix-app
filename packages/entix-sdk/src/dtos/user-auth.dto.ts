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

export type UserEntity = {
  id: string;
  sub: string;
  email: string;
  username: string;
  disabledAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SignUpDto = z.infer<typeof signUpSchema>;

export type SignUpResultDto = UserEntity;

export type LoginDto = z.infer<typeof loginSchema>;

export type LoginResultDto = {
  accessToken: string;
  refreshToken: string;
};

export type ResendConfirmationCodeDto = z.infer<typeof resendConfirmationCodeSchema>;

export type ConfirmSignUpDto = z.infer<typeof confirmSignUpSchema>;

export type ConfirmSignUpResultDto = {
  success: boolean;
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

export type AccessTokenPayloadResult = {
  sub: string;
  roles: string[];
};

export type RefreshTokenPayloadResult = {
  sub: string;
};
