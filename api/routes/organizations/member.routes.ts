import { createRoute } from "@hono/zod-openapi";
import { createMemberSchema, createMemberResponseSchema } from "@shared/schemas/dto/member.dto";
import { HttpStatusCodes, jsonContent, jsonContentRequired, HttpMethods } from "@api/helpers/http.helpers";
import { requireOwnerOrAdmin } from "@api/middleware/require-role.middleware";
import { z } from "zod";

export class MemberRoutes {
    static tags = ['Members'];

    static createMember = createRoute({
        tags: MemberRoutes.tags,
        method: HttpMethods.POST,
        path: '/organizations/{organizationId}/members',
        summary: "Create a new member and user",
        middleware: [requireOwnerOrAdmin] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
            body: jsonContentRequired(createMemberSchema, 'Member details'),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(createMemberResponseSchema, 'Member created successfully'),
            [HttpStatusCodes.BAD_REQUEST]: {
                description: "User already exists or invalid data"
            },
            [HttpStatusCodes.NOT_FOUND]: {
                description: "Organization not found"
            },
            [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
                description: "Internal server error"
            },
        },
    });
}
