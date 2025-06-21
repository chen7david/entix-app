import { z } from 'zod';
import { User } from '@models/user.model';
import { SuccessResultDto } from './common.dto';
import {
  accessTokenPayloadSchema,
  changePasswordSchema,
  confirmForgotPasswordSchema,
  confirmSignUpSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenPayloadSchema,
  resendConfirmationCodeSchema,
  signUpSchema,
} from '@schemas/user-auth.schema';

export type SignUpDto = z.infer<typeof signUpSchema>;

export type SignUpResultDto = User;

export type LoginDto = z.infer<typeof loginSchema>;

export type LoginResultDto = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    email: string;
  };
};

export type ResendConfirmationCodeDto = z.infer<typeof resendConfirmationCodeSchema>;

export type ConfirmSignUpDto = z.infer<typeof confirmSignUpSchema>;

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

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export type LogoutDto = z.infer<typeof logoutSchema>;

// Re-export SuccessResultDto from common.dto.ts
export type { SuccessResultDto };

export type AccessTokenPayloadDto = z.infer<typeof accessTokenPayloadSchema>;

export type RefreshTokenPayloadDto = z.infer<typeof refreshTokenPayloadSchema>;

export type AuthErrorDto = {
  code: string;
  message: string;
  status: number;
};
