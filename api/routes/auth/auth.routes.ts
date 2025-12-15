import { createRoute } from "@hono/zod-openapi";
import { authContextSchema, signInSchema, signUpSchema, userSchema } from "@shared/index";
import { HttpStatusCodes, jsonContent, jsonContentRequired, HttpMethods } from "@api/helpers/http.helpers";

export class AuthRoutes {
    static tags = ['Auth'];

    static signIn = createRoute({
        tags: AuthRoutes.tags,
        method: HttpMethods.POST,
        path: '/sign-in',
        request: {
            body: jsonContentRequired(signInSchema, 'User to sign in'),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(authContextSchema, 'User signed in'),
        },
    });

    static signUp = createRoute({
        tags: AuthRoutes.tags,
        method: HttpMethods.POST,
        path: '/sign-up',
        request: {
            body: jsonContentRequired(signUpSchema, 'User to create'),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(userSchema, 'User signed up'),
        },
    });
}