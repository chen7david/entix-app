import { createRoute } from "@hono/zod-openapi";
import { userSchema } from "@shared/index";
import { HttpStatusCodes, jsonContent, jsonContentRequired } from "../../helpers/http.helpers";

export class UserRoutes {
    static findAll = createRoute({
        tags: ['Users'],
        method: 'get',
        path: '/users',
        responses: {
            [HttpStatusCodes.OK]: jsonContent(userSchema.array(), 'List of all usesrs'),
        },
    });

    static create = createRoute({
        tags: ['Users'],
        method: 'post',
        path: '/users',
        request: {
            body: jsonContentRequired(userSchema, 'User to create'),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(userSchema.array(), 'List of all usesrs'),
        },
    });



}