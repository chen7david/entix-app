import { createRoute } from "@hono/zod-openapi";
import { createMemberSchema, createMemberResponseSchema } from "@shared/schemas/dto/member.dto";
import { HttpStatusCodes, jsonContent, jsonContentRequired, HttpMethods } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { z } from "zod";

export class MemberRoutes {
    static tags = ['Members'];

    static createMember = createRoute({
        tags: MemberRoutes.tags,
        method: HttpMethods.POST,
        path: '/orgs/{organizationId}/members',
        summary: "Create a new member and user",
        middleware: [requirePermission('member', ['create'])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
            body: jsonContentRequired(createMemberSchema, 'Member details'),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(createMemberResponseSchema, 'Member created successfully'),
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

    static getMembers = createRoute({
        tags: MemberRoutes.tags,
        method: HttpMethods.GET,
        path: '/orgs/{organizationId}/members',
        summary: "List all members of an organization",
        middleware: [requirePermission('member', ['update'])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.object({ members: z.array(z.any()) }), 'Members list'),
            [HttpStatusCodes.NOT_FOUND]: {
                description: "Organization not found"
            },
        },
    });

    static updateMemberRole = createRoute({
        tags: MemberRoutes.tags,
        method: HttpMethods.PUT,
        path: '/orgs/{organizationId}/members/{memberId}/role',
        summary: "Update a member's role",
        middleware: [requirePermission('member', ['update'])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                memberId: z.string()
            }),
            body: jsonContent(z.object({
                role: z.string().min(1, "Role is required"),
            }), "Role Update Request")
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), "Role updated successfully"),
            [HttpStatusCodes.NOT_FOUND]: { description: "Member or Organization not found" }
        }
    });

    static removeMember = createRoute({
        tags: MemberRoutes.tags,
        method: HttpMethods.DELETE,
        path: '/orgs/{organizationId}/members/{memberId}',
        summary: "Remove a member from an organization",
        middleware: [requirePermission('member', ['delete'])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                memberId: z.string()
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), "Member removed successfully"),
            [HttpStatusCodes.NOT_FOUND]: { description: "Member or Organization not found" }
        }
    });

}
