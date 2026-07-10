import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireSuperAdmin } from "@api/middleware/require-super-admin.middleware";
import { createRoute } from "@hono/zod-openapi";
import { paginatedUserResponseSchema } from "@shared/schemas/dto/user.dto";
import { PaginationQuerySchema } from "@shared/schemas/pagination.schema";

const tags = ["Admin - Users"];

export const AdminUsersRoutes = {
    tags,

    list: createRoute({
        tags,
        method: HttpMethods.GET,
        path: "/admin/users",
        middleware: [requireAuth, requireSuperAdmin] as const,
        request: {
            query: PaginationQuerySchema,
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                paginatedUserResponseSchema,
                "List of all users globally"
            ),
        },
    }),
};
