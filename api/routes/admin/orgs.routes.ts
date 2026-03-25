import { createRoute } from "@hono/zod-openapi";
import { HttpStatusCodes, jsonContent, HttpMethods } from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireSuperAdmin } from "@api/middleware/require-super-admin.middleware";
import { organizationListResponseSchema } from "@shared/schemas/dto/organization.dto";

export class AdminOrgsRoutes {
    static tags = ['Admin - Organizations'];

    static list = createRoute({
        tags: AdminOrgsRoutes.tags,
        method: HttpMethods.GET,
        path: '/admin/organizations',
        middleware: [requireAuth, requireSuperAdmin] as const,
        responses: {
            [HttpStatusCodes.OK]: jsonContent(organizationListResponseSchema, 'List of all organizations globally'),
        },
    });
}
