import { createRoute } from "@hono/zod-openapi";
import { userSchema } from "@shared/index";
import { HttpStatusCodes, jsonContent, jsonContentRequired, HttpMethods } from "@api/helpers/http.helpers";

export class UserRoutes {
    static tags = ['Users'];

    static findAll = createRoute({
        tags: UserRoutes.tags,
        method: HttpMethods.GET,
        path: '/users',
        responses: {
            [HttpStatusCodes.OK]: jsonContent(userSchema.array(), 'List of all users'),
        },
    });

    static create = createRoute({
        tags: UserRoutes.tags,
        method: HttpMethods.POST,
        path: '/users',
        request: {
            body: jsonContentRequired(userSchema, 'User to create'),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(userSchema.array(), 'List of all users'),
        },
    });
}