import { createRoute } from "@hono/zod-openapi";
import { userSchema } from "@shared/index";
import { HttpStatusCodes, jsonContent, HttpMethods } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { z } from "zod";

export class UserRoutes {
    static tags = ['Users'];

    static findAll = createRoute({
        tags: UserRoutes.tags,
        method: HttpMethods.GET,
        path: '/orgs/{organizationId}/users',
        middleware: [requirePermission('member', ['read'])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(userSchema.array(), 'List of users in organization'),
        },
    });
}
