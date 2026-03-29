import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireSuperAdmin } from "@api/middleware/require-super-admin.middleware";
import { createRoute, z } from "@hono/zod-openapi";
import {
    emailDetailSchema,
    emailListQuerySchema,
    emailListResponseSchema,
} from "@shared/schemas/dto/email-insights.dto";

const tags = ["Admin - Email Insights"];

export const EmailInsightsRoutes = {
    tags,

    list: createRoute({
        tags: tags,
        method: HttpMethods.GET,
        path: "/admin/emails",
        middleware: [requireAuth, requireSuperAdmin] as const,
        request: {
            query: emailListQuerySchema,
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                emailListResponseSchema,
                "List of sent emails from Resend"
            ),
        },
    }),

    get: createRoute({
        tags: tags,
        method: HttpMethods.GET,
        path: "/admin/emails/{emailId}",
        middleware: [requireAuth, requireSuperAdmin] as const,
        request: {
            params: z.object({ emailId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(emailDetailSchema, "Email detail from Resend"),
        },
    }),
};
