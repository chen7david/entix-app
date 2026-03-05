import { createRoute } from "@hono/zod-openapi";
import { HttpStatusCodes, jsonContent, HttpMethods } from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireSuperAdmin } from "@api/middleware/require-super-admin.middleware";
import { z } from "zod";

const organizationSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    logo: z.string().nullable(),
    createdAt: z.number().or(z.date()).transform(d => new Date(d).getTime()),
    metadata: z.string().nullable(),
});

const organizationListResponseSchema = z.array(organizationSchema);

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
