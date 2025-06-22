import { z } from 'zod';

export const signUpSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
  invitationCode: z.string().length(6, { message: 'Invitation code must be exactly 6 characters' }),
});

export const resendConfirmationCodeSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
});

export const confirmSignUpSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  confirmationCode: z.string().length(6, { message: 'Confirmation code must be exactly 6 characters' }),
});

export const loginSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
});

export const forgotPasswordSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
});

export const confirmForgotPasswordSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  confirmationCode: z.string().length(6, { message: 'Confirmation code must be exactly 6 characters' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
});

export const changePasswordSchema = z.object({
  accessToken: z.string().min(1, { message: 'Access token is required' }),
  oldPassword: z.string().min(8, { message: 'Old password must be at least 8 characters' }),
  newPassword: z
    .string()
    .min(8, { message: 'New password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'New password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'New password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'New password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'New password must contain at least one special character' }),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
});

export const accessTokenPayloadSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  permissions: z.array(z.number()).min(1),
  exp: z.number(),
  iat: z.number(),
});

export const refreshTokenPayloadSchema = z.object({
  sub: z.string().min(1),
  exp: z.number(),
  iat: z.number(),
});
