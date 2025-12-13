import { z } from '@hono/zod-openapi'

export const userSchema = z.object({
    name: z.string().min(3, { message: "Username must be at least 3 characters" }).max(255),
    email: z.email({ message: "Invalid email address" }),
});

export const loginSchema = z.object({
    username: z.string('Username is required').min(1, "Username is required").openapi({
        param: {
            name: 'username',
            in: 'path',
        },
        example: 'chen7david',
    }),
    password: z.string('Password is required').min(1, "Password is required"),
});

export type UserDTO = z.infer<typeof userSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
