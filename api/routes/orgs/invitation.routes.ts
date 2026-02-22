import { createRoute } from "@hono/zod-openapi";
import { HttpStatusCodes, jsonContent, HttpMethods } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { z } from "zod";

export class InvitationRoutes {
    static tags = ['Invitations'];

    static getInvitations = createRoute({
        tags: InvitationRoutes.tags,
        method: HttpMethods.GET,
        path: '/orgs/{organizationId}/invitations',
        summary: "List all invitations of an organization",
        middleware: [requirePermission('member', ['update'])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.object({ invitations: z.array(z.any()) }), 'Invitations list'),
            [HttpStatusCodes.NOT_FOUND]: {
                description: "Organization not found"
            },
            [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
                description: "Internal server error"
            },
        },
    });

    static inviteMember = createRoute({
        tags: InvitationRoutes.tags,
        method: HttpMethods.POST,
        path: '/orgs/{organizationId}/invitations',
        summary: "Invite a new member to the organization",
        middleware: [requirePermission('invitation', ['create'])] as const,
        request: {
            params: z.object({ organizationId: z.string() }),
            body: jsonContent(z.object({
                email: z.string().email("Invalid email address"),
                role: z.string().min(1, "Role is required")
            }), "Invitation Details")
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(z.any(), 'Invitation created'),
            [HttpStatusCodes.CONFLICT]: { description: "User is already invited or a member" },
            [HttpStatusCodes.BAD_REQUEST]: { description: "Invalid input" }
        }
    });

    static cancelInvitation = createRoute({
        tags: InvitationRoutes.tags,
        method: HttpMethods.POST,
        path: '/orgs/{organizationId}/invitations/{invitationId}/cancel',
        summary: "Cancel a pending invitation",
        middleware: [requirePermission('invitation', ['cancel'])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                invitationId: z.string()
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), "Invitation cancelled"),
            [HttpStatusCodes.NOT_FOUND]: { description: "Invitation not found" }
        }
    });

}
