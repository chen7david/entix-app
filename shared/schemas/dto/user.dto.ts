import { z } from '@hono/zod-openapi'

export const userSchema = z.object({
    id: z.string().openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }).openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    name: z.string().openapi({ example: "name" }),
    email: z.string().openapi({ example: "email@example.com" }),
    emailVerified: z.boolean().openapi({ example: false }),
    image: z.string().openapi({ example: "image" }).nullable().optional(),
    createdAt: z.date().openapi({ example: new Date().toISOString() }),
    updatedAt: z.date().openapi({ example: new Date().toISOString() }),
});

export type UserDTO = z.infer<typeof userSchema>;

export const createUserSchema = z.object({
    email: z.email().openapi({ example: "user@example.com" }),
    name: z.string().min(1).openapi({ example: "John Doe" }),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;
