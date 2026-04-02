import { z } from "@hono/zod-openapi";

export const baseSchema = z.object({
    id: z.string().openapi({
        example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    createdAt: z.union([z.number(), z.coerce.date()]).openapi({
        type: "number",
        example: Date.now(),
    }),
    updatedAt: z
        .union([z.number(), z.coerce.date()])
        .openapi({
            type: "number",
            example: Date.now(),
        })
        .optional(),
});

export type BaseDTO = z.infer<typeof baseSchema>;

export const successResponseSchema = z
    .object({
        success: z.boolean(),
    })
    .openapi("SuccessResponse");

export const idResponseSchema = z
    .object({
        id: z.string(),
    })
    .openapi("IdResponse");

export type SuccessResponseDTO = z.infer<typeof successResponseSchema>;
export type IdResponseDTO = z.infer<typeof idResponseSchema>;

/**
 * Standard pagination envelope for all list endpoints.
 * Supports both cursor-based and offset-based pagination via 'total'.
 */
export type PaginatedResponse<T> = {
    items: T[];
    total: number;
    nextCursor: string | null;
    prevCursor: string | null;
};
