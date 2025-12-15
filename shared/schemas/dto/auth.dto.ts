import { z } from '@hono/zod-openapi'
import { userSchema } from './user.dto';

export const signInSchema = z.object({
    username: z.string('Username is required').min(1, "Username is required").openapi({
        param: {
            name: 'username',
            in: 'path',
        },
        example: 'chen7david',
    }),
    password: z.string('Password is required').min(1, "Password is required").openapi({
        param: {
            name: 'password',
            in: 'path',
        },
        example: 'password',
    }),
});

export type SignInDTO = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
    username: z.string('Username is required').min(1, "Username is required").openapi({
        param: {
            name: 'username',
            in: 'path',
        },
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
