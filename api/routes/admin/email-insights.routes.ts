import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireSuperAdmin } from "@api/middleware/require-super-admin.middleware";
import { createRoute, z } from "@hono/zod-openapi";
import {
    emailDetailSchema,
    paginatedEmailResponseSchema,
} from "@shared/schemas/dto/email-insights.dto";
import { PaginationQuerySchema } from "@shared/schemas/pagination.schema";

const tags = ["Admin - Email Insights"];

export const EmailInsightsRoutes = {
    tags,

    list: createRoute({
        tags: tags,
        method: HttpMethods.GET,
        path: "/admin/emails",
        middleware: [requireAuth, requireSuperAdmin] as const,
        request: {
            query: PaginationQuerySchema,
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                paginatedEmailResponseSchema,
                "Standardized paginated list of sent emails from Resend"
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
