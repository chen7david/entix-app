import { z } from "@hono/zod-openapi";
import { baseSchema } from "./base.dto";

export const userSchema = baseSchema.extend({
    name: z.string().openapi({ example: "name" }),
    email: z.string().openapi({ example: "email@example.com" }),
    emailVerified: z.boolean().openapi({ example: false }),
    image: z.string().openapi({ example: "image" }).nullable().optional(),
    role: z.string().openapi({ example: "user" }),
    xid: z.string().openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    theme: z.string().openapi({ example: "system" }).nullable().optional(),
    timezone: z.string().openapi({ example: "UTC" }).nullable().optional(),
});

export type UserDTO = z.infer<typeof userSchema>;

import { createPaginatedResponseSchema } from "../pagination.schema";

export const paginatedUserResponseSchema = createPaginatedResponseSchema(userSchema);

export const createUserSchema = z.object({
    email: z.string().email().openapi({ example: "user@example.com" }),
    name: z.string().min(1).openapi({ example: "John Doe" }),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;
