import { createRoute, z } from "@hono/zod-openapi";
import { HttpStatusCodes, HttpMethods } from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireOrgMembership } from "@api/middleware/org-membership.middleware";

/**
 * Avatar routes for updating/removing member profile pictures.
 *
 * Both endpoints require org membership. Authorization logic for
 * self-update vs admin-update is handled in the handler layer.
 */
export const AvatarRoutes = {
    /**
     * Update a member's avatar by linking a completed upload to user.image.
     * - The upload must already exist and be in "completed" status.
     * - If the user already has an avatar, the old file is deleted from R2.
     */
    updateAvatar: createRoute({
        method: HttpMethods.PATCH,
        path: "/orgs/{organizationId}/members/{userId}/avatar",
        tags: ["Member Avatars"],
        middleware: [
            requireAuth,
            requireOrgMembership,
        ] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                userId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            uploadId: z.string().min(1),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            imageUrl: z.string(),
                        }),
                    },
                },
                description: "Avatar updated successfully",
            },
            [HttpStatusCodes.FORBIDDEN]: {
                description: "Not allowed to update this member's avatar",
            },
            [HttpStatusCodes.NOT_FOUND]: {
                description: "Upload or member not found",
            },
        },
    }),

    /**
     * Remove a member's avatar. Deletes the file from R2 and sets user.image to null.
     */
    removeAvatar: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/members/{userId}/avatar",
        tags: ["Member Avatars"],
        middleware: [
            requireAuth,
            requireOrgMembership,
        ] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                userId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: {
                description: "Avatar removed successfully",
            },
            [HttpStatusCodes.FORBIDDEN]: {
                description: "Not allowed to remove this member's avatar",
            },
            [HttpStatusCodes.NOT_FOUND]: {
                description: "Member not found or no avatar to remove",
            },
        },
    }),
};
