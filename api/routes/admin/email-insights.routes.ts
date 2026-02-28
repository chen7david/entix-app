import { createRoute } from "@hono/zod-openapi";
import { HttpStatusCodes, jsonContent, HttpMethods } from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireSuperAdmin } from "@api/middleware/require-super-admin.middleware";
import { z } from "zod";

const emailEventSchema = z.enum([
    "sent",
    "delivered",
    "delivery_delayed",
    "complained",
    "bounced",
    "opened",
    "clicked",
]);

const emailSummarySchema = z.object({
    id: z.string(),
    to: z.array(z.string()).nullable(),
    from: z.string(),
    subject: z.string().nullable(),
    created_at: z.string(),
    last_event: emailEventSchema.nullable(),
    scheduled_at: z.string().nullable(),
    bcc: z.array(z.string()).nullable(),
    cc: z.array(z.string()).nullable(),
    reply_to: z.array(z.string()).nullable(),
});

const emailDetailSchema = emailSummarySchema.extend({
    html: z.string().nullable(),
    text: z.string().nullable(),
    tags: z.array(z.object({ name: z.string(), value: z.string() })).nullable(),
});

const emailListResponseSchema = z.object({
    object: z.literal("list"),
    data: z.array(emailSummarySchema),
    has_more: z.boolean(),
});

const emailListQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(20).optional(),
    after: z.string().optional(),
    before: z.string().optional(),
});

export class EmailInsightsRoutes {
    static tags = ['Admin - Email Insights'];

    static list = createRoute({
        tags: EmailInsightsRoutes.tags,
        method: HttpMethods.GET,
        path: '/admin/emails',
        middleware: [requireAuth, requireSuperAdmin] as const,
        request: {
            query: emailListQuerySchema,
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(emailListResponseSchema, 'List of sent emails from Resend'),
        },
    });

    static get = createRoute({
        tags: EmailInsightsRoutes.tags,
        method: HttpMethods.GET,
        path: '/admin/emails/{emailId}',
        middleware: [requireAuth, requireSuperAdmin] as const,
        request: {
            params: z.object({ emailId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(emailDetailSchema, 'Email detail from Resend'),
        },
    });
}
