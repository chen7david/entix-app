import { z } from '@hono/zod-openapi'

// export const userSchema = z.object({
//     id: z.uuid().openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }).openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
//     // xid: z.uuid().openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }).openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
//     username: z.string().min(3, { message: "Username must be at least 3 characters" }).max(32).openapi({ example: "username" }),
//     email: z.email({ message: "Invalid email address" }).openapi({ example: "email@example.com" }),
//     password: z.string().min(8, { message: "Password must be at least 8 characters" }).openapi({ example: "password" }),
//     // createdAt: z.date().openapi({ example: new Date().toISOString() }).openapi({ example: new Date().toISOString() }),
//     // updatedAt: z.date().openapi({ example: new Date().toISOString() }).openapi({ example: new Date().toISOString() }),
//     // deletedAt: z.date().openapi({ example: new Date().toISOString() }).optional().openapi({ example: new Date().toISOString() }).optional(),
// });

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
