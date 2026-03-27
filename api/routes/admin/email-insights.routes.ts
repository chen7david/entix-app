import { createRoute, z } from "@hono/zod-openapi";
import { HttpStatusCodes, jsonContent, HttpMethods } from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireSuperAdmin } from "@api/middleware/require-super-admin.middleware";
import { 
    emailDetailSchema, 
    emailListResponseSchema, 
    emailListQuerySchema 
} from "@shared/schemas/dto/email-insights.dto";

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
