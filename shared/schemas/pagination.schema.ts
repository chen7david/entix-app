import { z } from "zod";

export const PaginationQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(25),
    cursor: z.string().optional(),
    direction: z.enum(["next", "prev"]).default("next"),
    search: z.string().optional(), // Global wildcard query text matching
});

export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        items: z.array(itemSchema),
        nextCursor: z.string().nullable(),
        prevCursor: z.string().nullable(),
        totalCount: z.number().optional(),
    });

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
