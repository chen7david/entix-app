import { createRoute } from "@hono/zod-openapi";
import { authContextSchema, signInSchema, signUpSchema, userSchema } from "@shared/index";
import { HttpStatusCodes, jsonContent, jsonContentRequired } from "@api/helpers/http.helpers";

export class AuthRoutes {
    static signIn = createRoute({
        tags: ['Auth'],
        method: 'post',
        path: '/sign-in',
        request: {
            body: jsonContentRequired(signInSchema, 'User to sign in'),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(authContextSchema, 'User signed in'),
        },
    });

    static signUp = createRoute({
        tags: ['Auth'],
        method: 'post',
        path: '/sign-up',
        request: {
            body: jsonContentRequired(signUpSchema, 'User to create'),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(userSchema, 'User signed up'),
        },
    });
}