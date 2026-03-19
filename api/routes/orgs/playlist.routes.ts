import { createRoute, z } from "@hono/zod-openapi";
import { HttpMethods, HttpStatusCodes } from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireOrgMembership } from "@api/middleware/org-membership.middleware";
import { requirePermission } from "@api/middleware/require-permission.middleware";

const PlaylistResponseSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    coverArtUrl: z.string().nullable(),
    createdBy: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

const PlaylistMediaItemResponseSchema = z.object({
    playlistId: z.string(),
    mediaId: z.string(),
    position: z.number(),
    addedAt: z.coerce.date(),
});

export const PlaylistRoutes = {
    listPlaylists: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/playlists",
        tags: ["Playlist"],
        middleware: [requireAuth, requireOrgMembership] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.array(PlaylistResponseSchema),
                    },
                },
                description: "List of playlists",
            },
        },
    }),

    createPlaylist: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/playlists",
        tags: ["Playlist"],
        middleware: [
            requireAuth, 
            requireOrgMembership, 
            requirePermission('media', ['create']) // piggy backing media clearance here
        ] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            title: z.string().min(1).max(255),
                            description: z.string().optional(),
                            coverArtUploadId: z.string().optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.CREATED]: {
                content: {
                    "application/json": {
                        schema: PlaylistResponseSchema,
                    },
                },
                description: "Playlist created successfully",
            },
        },
    }),

    updatePlaylist: createRoute({
        method: HttpMethods.PATCH,
        path: "/orgs/{organizationId}/playlists/{playlistId}",
        tags: ["Playlist"],
        middleware: [
            requireAuth, 
            requireOrgMembership, 
            requirePermission('media', ['update'])
        ] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                playlistId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            title: z.string().min(1).max(255).optional(),
                            description: z.string().optional(),
                            coverArtUploadId: z.string().optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: PlaylistResponseSchema,
                    },
                },
                description: "Playlist updated successfully",
            },
        },
    }),

    deletePlaylist: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/playlists/{playlistId}",
        tags: ["Playlist"],
        middleware: [
            requireAuth, 
            requireOrgMembership, 
            requirePermission('media', ['delete'])
        ] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                playlistId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: {
                description: "Playlist deleted successfully",
            },
        },
    }),

    getSequence: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/playlists/{playlistId}/sequence",
        tags: ["Playlist"],
        middleware: [requireAuth, requireOrgMembership] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                playlistId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.array(PlaylistMediaItemResponseSchema),
                    },
                },
                description: "Playlist media sequence",
            },
        },
    }),

    updateSequence: createRoute({
        method: HttpMethods.PUT,
        path: "/orgs/{organizationId}/playlists/{playlistId}/sequence",
        tags: ["Playlist"],
        middleware: [requireAuth, requireOrgMembership, requirePermission('media', ['update'])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                playlistId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            mediaIds: z.array(z.string()),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: {
                description: "Sequence successfully updated",
            },
        },
    }),
};
