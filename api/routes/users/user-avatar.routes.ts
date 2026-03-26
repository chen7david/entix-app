import { createRoute, z } from "@hono/zod-openapi";
import { HttpStatusCodes, HttpMethods, jsonContentRequired } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";

/**
 * Global Avatar Routes
 * 
 * These routes are organization-independent and live under the /users prefix.
 * They allow users to manage their global profile identity.
 */
export class UserAvatarRoutes {
    static tags = ["User Avatars"];

    /**
     * Request a presigned URL for avatar upload.
     */
    static requestAvatarUploadUrl = createRoute({
        tags: UserAvatarRoutes.tags,
        method: HttpMethods.POST,
        path: "/users/{userId}/avatar/presigned-url",
        middleware: [
            requirePermission('avatar', ['create'], 'userId')
        ] as const,
        request: {
            params: z.object({
                userId: z.string(),
            }),
            body: jsonContentRequired(z.object({
                originalName: z.string().min(1),
                contentType: z.string().min(1),
                fileSize: z.number().positive(),
            }), 'Upload details'),
        },
        responses: {
            [HttpStatusCodes.CREATED]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            uploadId: z.string(),
                            presignedUrl: z.string(),
                            url: z.string(),
                            bucketKey: z.string(),
                        }),
                    },
                },
                description: "Presigned URL created successfully",
            },
        },
    });

    /**
     * Update a user's avatar by linking a completed upload.
     */
    static updateAvatar = createRoute({
        tags: UserAvatarRoutes.tags,
        method: HttpMethods.PATCH,
        path: "/users/{userId}/avatar",
        middleware: [
            requirePermission('avatar', ['update'], 'userId')
        ] as const,
        request: {
            params: z.object({
                userId: z.string(),
            }),
            body: jsonContentRequired(z.object({
                uploadId: z.string(),
            }), 'Avatar update details'),
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
        },
    });

    /**
     * Remove a user's avatar.
     */
    static removeAvatar = createRoute({
        tags: UserAvatarRoutes.tags,
        method: HttpMethods.DELETE,
        path: "/users/{userId}/avatar",
        middleware: [
            requirePermission('avatar', ['delete'], 'userId')
        ] as const,
        request: {
            params: z.object({
                userId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: {
                description: "Avatar removed successfully",
            },
        },
    });
}
