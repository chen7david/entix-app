import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireSuperAdmin } from "@api/middleware/require-super-admin.middleware";
import { createRoute } from "@hono/zod-openapi";
import { organizationListResponseSchema } from "@shared/schemas/dto/organization.dto";

const tags = ["Admin - Organizations"];

export const AdminOrgsRoutes = {
    tags,

    list: createRoute({
        tags: tags,
        method: HttpMethods.GET,
        path: "/admin/organizations",
        middleware: [requireAuth, requireSuperAdmin] as const,
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                organizationListResponseSchema,
                "List of all organizations globally"
            ),
        },
    }),
};
