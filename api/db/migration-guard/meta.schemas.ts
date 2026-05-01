import { z } from "zod";

export const MigrationTagSchema = z.string().regex(/^\d{4}_[\w]+$/);

export const JournalEntrySchema = z.object({
    idx: z.number().int().nonnegative(),
    when: z.number(),
    tag: MigrationTagSchema,
    breakpoints: z.boolean(),
    version: z.string().optional(),
});

export const JournalSchema = z.object({
    version: z.string(),
    dialect: z.literal("sqlite"),
    entries: z.array(JournalEntrySchema),
});

export const SnapshotSchema = z
    .object({
        id: z.string(),
        version: z.string(),
        dialect: z.string(),
        tables: z.record(z.string(), z.unknown()),
        prevId: z.string(),
        prevSnapshot: z.string().optional(),
    })
    .refine((value) => Boolean(value.prevId), {
        message: "Snapshot must include prevId",
    });
