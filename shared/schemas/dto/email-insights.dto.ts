import { z } from "@hono/zod-openapi";

export const emailEventSchema = z
    .enum(["sent", "delivered", "delivery_delayed", "complained", "bounced", "opened", "clicked"])
    .openapi({ example: "delivered" });

export const emailSummarySchema = z.object({
    id: z.string().openapi({ example: "email_123" }),
    to: z
        .array(z.string())
        .nullable()
        .openapi({ example: ["user@example.com"] }),
    from: z.string().openapi({ example: "noreply@example.com" }),
    subject: z.string().nullable().openapi({ example: "Hello World" }),
    created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    last_event: emailEventSchema.nullable(),
    scheduled_at: z.string().nullable().openapi({ example: null }),
    bcc: z.array(z.string()).nullable().openapi({ example: null }),
    cc: z.array(z.string()).nullable().openapi({ example: null }),
    reply_to: z.array(z.string()).nullable().openapi({ example: null }),
});

export const emailDetailSchema = emailSummarySchema.extend({
    html: z.string().nullable().openapi({ example: "<html><body>Hello</body></html>" }),
    text: z.string().nullable().openapi({ example: "Hello" }),
    tags: z
        .array(
            z.object({
                name: z.string(),
                value: z.string(),
            })
        )
        .nullable()
        .openapi({ example: [{ name: "category", value: "welcome" }] }),
});

import { createPaginatedResponseSchema } from "../pagination.schema";

export const paginatedEmailResponseSchema = createPaginatedResponseSchema(emailSummarySchema);

export type EmailEvent = z.infer<typeof emailEventSchema>;
export type EmailSummaryDTO = z.infer<typeof emailSummarySchema>;
export type EmailDetailDTO = z.infer<typeof emailDetailSchema>;
