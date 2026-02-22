import { createRoute, z } from "@hono/zod-openapi";
import { HttpStatusCodes, jsonContent, HttpMethods } from "@api/helpers/http.helpers";

const organizationSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string().nullable(),
    logo: z.string().nullable().optional(),
    createdAt: z.string().or(z.date()),
    metadata: z.any().nullable().optional()
});

export class AdminRoutes {
    static tags = ['Admin'];

    static getOrganizations = createRoute({
        tags: AdminRoutes.tags,
        method: HttpMethods.GET,
        path: '/admin/organizations',
        summary: "Get all organizations globally",
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.object({
                    organizations: z.array(organizationSchema),
                }),
                'List of all organizations'
            ),
            [HttpStatusCodes.UNAUTHORIZED]: { description: "Unauthorized" },
            [HttpStatusCodes.FORBIDDEN]: { description: "Forbidden - Requires Super Admin" },
        },
    });
}
