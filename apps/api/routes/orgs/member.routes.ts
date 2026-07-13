import {
    HttpMethods,
    HttpStatusCodes,
    jsonContent,
    jsonContentRequired,
} from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { createRoute } from "@hono/zod-openapi";
import {
    createMemberResponseSchema,
    createMemberSchema,
    updateMemberAccountResponseSchema,
    updateMemberAccountSchema,
} from "@shared/schemas/dto/member.dto";
import { z } from "zod";

const tags = ["Members"];

export const MemberRoutes = {
    tags,

    createMember: createRoute({
        tags: tags,
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/members",
        summary: "Create a new member and user",
        middleware: [requirePermission("member", ["create"])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
            body: jsonContentRequired(createMemberSchema, "Member details"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(
                createMemberResponseSchema,
                "Member created successfully"
            ),
            [HttpStatusCodes.BAD_REQUEST]: {
                description: "User already exists or invalid data",
            },
            [HttpStatusCodes.NOT_FOUND]: {
                description: "Organization not found",
            },
            [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
                description: "Internal server error",
            },
        },
    }),

    updateMemberAccount: createRoute({
        tags: tags,
        method: HttpMethods.PATCH,
        path: "/orgs/{organizationId}/members/{userId}/account",
        summary: "Update a member's login account (email)",
        middleware: [requirePermission("member", ["update"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                userId: z.string(),
            }),
            body: jsonContentRequired(updateMemberAccountSchema, "Account update"),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                updateMemberAccountResponseSchema,
                "Member account updated"
            ),
            [HttpStatusCodes.BAD_REQUEST]: {
                description: "Invalid email",
            },
            [HttpStatusCodes.CONFLICT]: {
                description: "Email already in use",
            },
            [HttpStatusCodes.NOT_FOUND]: {
                description: "Member not found",
            },
        },
    }),
};
