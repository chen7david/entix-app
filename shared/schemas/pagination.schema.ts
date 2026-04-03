import { z } from "zod";

export const PaginationQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    cursor: z.string().optional(),
    direction: z.enum(["next", "prev"]).default("next"),
    search: z.string().optional(),
});

export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        items: z.array(itemSchema),
        nextCursor: z.string().nullable(),
        prevCursor: z.string().nullable(),
    });

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
