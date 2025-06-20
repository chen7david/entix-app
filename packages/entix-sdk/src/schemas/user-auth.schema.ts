import { z } from 'zod';

export const signUpSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  invitationCode: z.string().length(6),
});

export const resendConfirmationCodeSchema = z.object({
  username: z.string().min(1),
});

export const confirmSignUpSchema = z.object({
  username: z.string().min(3),
  confirmationCode: z.string().length(6),
});

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
});

export const forgotPasswordSchema = z.object({
  username: z.string().min(3),
});

export const confirmForgotPasswordSchema = z.object({
  username: z.string().min(3),
  confirmationCode: z.string().length(6),
  password: z.string().min(8),
});

export const changePasswordSchema = z.object({
  cognitoAccessToken: z.string().min(1),
  oldPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export const logoutSchema = z.object({
  cognitoAccessToken: z.string().min(1),
});

export const accessTokenPayloadSchema = z.object({
  sub: z.string().min(1),
  permissions: z.array(z.number()).min(1),
});

export const refreshTokenPayloadSchema = z.object({
  sub: z.string().min(1),
});
