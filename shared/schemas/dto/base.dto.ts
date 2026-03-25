import { z } from '@hono/zod-openapi'

export const baseSchema = z.object({
    id: z.string().openapi({
        example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    createdAt: z.coerce.date().openapi({
        example: new Date().toISOString(),
    }),
    updatedAt: z.coerce.date().openapi({
        example: new Date().toISOString(),
    }).optional(),
});

export type BaseDTO = z.infer<typeof baseSchema>;
