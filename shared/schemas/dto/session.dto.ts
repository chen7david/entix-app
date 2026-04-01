import { z } from "zod";

export const createSessionSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title is too long"),
    description: z.string().optional(),
    startTime: z
        .number()
        .refine((val) => val > Date.now(), { message: "Session must be scheduled in the future" }),
    durationMinutes: z
        .number()
        .min(15, "Minimum duration is 15 minutes")
        .max(480, "Maximum duration is 8 hours"),
    userIds: z.array(z.string()).optional().default([]),
    recurrence: z
        .object({
            frequency: z.enum(["weekly"]),
            count: z.number().min(1).max(52),
        })
        .optional(),
    status: z.enum(["scheduled", "completed", "cancelled"]).optional().default("scheduled"),
});

export const updateSessionSchema = createSessionSchema.partial().extend({
    updateForward: z.boolean().optional().default(false),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
