import { createRoute } from "@hono/zod-openapi";
import { userSchema, createUserSchema } from "@shared/index";
import { HttpStatusCodes, jsonContent, jsonContentRequired, HttpMethods } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { z } from "zod";

export class UserRoutes {
    static tags = ['Users'];

    static findAll = createRoute({
        tags: UserRoutes.tags,
        method: HttpMethods.GET,
        path: '/orgs/{organizationId}/users',
        middleware: [requirePermission('member', ['create'])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(userSchema.array(), 'List of users in organization'),
        },
    });

    static create = createRoute({
        tags: UserRoutes.tags,
        method: HttpMethods.POST,
        path: '/orgs/{organizationId}/users',
        middleware: [requirePermission('member', ['create'])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
            body: jsonContentRequired(createUserSchema, 'User to create'),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(userSchema, 'User created'),
        },
    });
}