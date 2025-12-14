import { createRoute } from "@hono/zod-openapi";
import { userSchema } from "@shared/index";
import { HttpStatusCodes } from "../../helpers/http.helpers";
import { validator } from "../../middleware/zod-validator";
import { jsonContent } from "../../helpers/http.helpers";

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
            body: jsonContent(userSchema, 'User to create'),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(userSchema.array(), 'List of all usesrs'),
        },
        middleware: [validator('json', userSchema)],
    });



}