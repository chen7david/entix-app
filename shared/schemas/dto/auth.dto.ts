import { z } from '@hono/zod-openapi'
import { userSchema } from './user.dto';

export const signInSchema = z.object({
    username: z.string('Username is required').min(1, "Username is required").openapi({
        example: 'chen7david',
    }),
    password: z.string('Password is required').min(1, "Password is required").openapi({
        example: 'password',
    }),
});

export type SignInDTO = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
    username: z.string('Username is required').min(1, "Username is required").openapi({
        example: 'chen7david',
    }),
    password: z.string('Password is required').min(1, "Password is required"),
});

export type SignUpDTO = z.infer<typeof signUpSchema>;

export const authContextSchema = z.object({
    user: userSchema.openapi({
        example: {
            id: "123e4567-e89b-12d3-a456-426614174000",
            xid: "123e4567-e89b-12d3-a456-426614174000",
            username: "username",
            email: "email@example.com",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    }),
    token: z.string().openapi({ example: "xxxxx.yyyyy.zzzzz" }),
    refreshToken: z.string().openapi({ example: "xxxxx.yyyyy.zzzzz" }),
});


export type AuthContextDTO = z.infer<typeof authContextSchema>;

export const signUpWithOrgSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
    organizationName: z.string().min(2),
});

export type SignUpWithOrgDTO = z.infer<typeof signUpWithOrgSchema>;

export const signUpWithOrgResponseSchema = z.object({
    user: z.object({
        id: z.string(),
        email: z.string(),
        name: z.string(),
        role: z.string(),
    }),
    organization: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
    }),
});

export type SignUpWithOrgResponseDTO = z.infer<typeof signUpWithOrgResponseSchema>;
