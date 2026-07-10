import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { createRoute } from "@hono/zod-openapi";
import { memberDTOSchema } from "@shared/index";
import {
    createPaginatedResponseSchema,
    PaginationQuerySchema,
} from "@shared/schemas/pagination.schema";
import { z } from "zod";

export class UserRoutes {
    static tags = ["Users"];

    static findAll = createRoute({
        tags: UserRoutes.tags,
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/users",
        middleware: [requirePermission("member", ["read"])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
            query: PaginationQuerySchema,
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                createPaginatedResponseSchema(memberDTOSchema),
                "Paginated list of users in organization"
            ),
        },
    });
}
