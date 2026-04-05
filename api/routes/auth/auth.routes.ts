import {
    HttpMethods,
    HttpStatusCodes,
    jsonContent,
    jsonContentRequired,
} from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireSuperAdmin } from "@api/middleware/require-super-admin.middleware";
import { createRoute } from "@hono/zod-openapi";
import {
    resendVerificationSchema,
    signUpWithOrgResponseSchema,
    signUpWithOrgSchema,
} from "@shared/schemas/dto/auth.dto";

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

    resendVerificationAdmin: createRoute({
        tags: tags,
        method: HttpMethods.POST,
        path: "/auth/admin/resend-verification",
        middleware: [requireAuth, requireSuperAdmin] as const,
        summary: "Resend verification email (Admin only)",
        request: {
            body: jsonContentRequired(resendVerificationSchema, "User email"),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                description: "Verification email sent",
            },
            [HttpStatusCodes.BAD_REQUEST]: {
                description: "Bad request",
            },
            [HttpStatusCodes.UNAUTHORIZED]: {
                description: "Unauthorized",
            },
            [HttpStatusCodes.FORBIDDEN]: {
                description: "Forbidden",
            },
            [HttpStatusCodes.NOT_FOUND]: {
                description: "User not found",
            },
            [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
                description: "Internal server error",
            },
        },
    }),
};
