import {
    HttpMethods,
    HttpStatusCodes,
    jsonContent,
    jsonContentRequired,
} from "@api/helpers/http.helpers";
import { createRoute } from "@hono/zod-openapi";
import { signUpWithOrgResponseSchema, signUpWithOrgSchema } from "@shared/schemas/dto/auth.dto";

const tags = ["Auth"];

export const AuthRoutes = {
    tags,

    signupWithOrg: createRoute({
        tags: tags,
        method: HttpMethods.POST,
        path: "/auth/signup-with-org",
        summary: "Sign up a new user and create an organization",
        request: {
            body: jsonContentRequired(signUpWithOrgSchema, "User and Organization details"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                signUpWithOrgResponseSchema,
                "User and organization created successfully"
            ),
            [HttpStatusCodes.BAD_REQUEST]: {
                description: "Bad request",
            },
            [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
                description: "Internal server error",
            },
        },
    }),
};
