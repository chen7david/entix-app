import { createRoute } from "@hono/zod-openapi";
import { signUpWithOrgSchema, signUpWithOrgResponseSchema } from "@shared/schemas/dto/auth.dto";
import { HttpStatusCodes, jsonContent, jsonContentRequired, HttpMethods } from "@api/helpers/http.helpers";

export class AuthRoutes {
    static tags = ['Auth'];

    static signupWithOrg = createRoute({
        tags: AuthRoutes.tags,
        method: HttpMethods.POST,
        path: '/auth/signup-with-org',
        summary: "Sign up a new user and create an organization",
        request: {
            body: jsonContentRequired(signUpWithOrgSchema, 'User and Organization details'),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(signUpWithOrgResponseSchema, 'User and organization created successfully'),
            [HttpStatusCodes.BAD_REQUEST]: {
                description: "Bad request",
            },
            [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
                description: "Internal server error",
            },
        },
    });
}
