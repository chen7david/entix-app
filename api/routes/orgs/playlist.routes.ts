import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { createRoute, z } from "@hono/zod-openapi";
import {
    createPlaylistSchema,
    playlistMediaItemSchema,
    playlistSchema,
    updatePlaylistSchema,
    updateSequenceSchema,
} from "@shared/schemas/dto/playlist.dto";
import {
    createPaginatedResponseSchema,
    PaginationQuerySchema,
} from "@shared/schemas/pagination.schema";

export const PlaylistRoutes = {
    listPlaylists: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/playlists",
        tags: ["Playlist"],
        middleware: [requirePermission("playlist", ["read"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
            query: PaginationQuerySchema,
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                createPaginatedResponseSchema(playlistSchema),
                "List of playlists"
            ),
        },
    }),

    createPlaylist: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/playlists",
        tags: ["Playlist"],
        middleware: [requirePermission("playlist", ["create"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
            body: jsonContent(createPlaylistSchema, "Playlist creation data"),
        },
        responses: {
            [HttpStatusCodes.CREATED]: jsonContent(playlistSchema, "Playlist created successfully"),
        },
    }),

    getPlaylist: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/playlists/{playlistId}",
        tags: ["Playlist"],
        middleware: [requirePermission("playlist", ["read"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                playlistId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(playlistSchema, "Playlist retrieval"),
        },
    }),

    updatePlaylist: createRoute({
        method: HttpMethods.PATCH,
        path: "/orgs/{organizationId}/playlists/{playlistId}",
        tags: ["Playlist"],
        middleware: [requirePermission("playlist", ["update"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                playlistId: z.string(),
            }),
            body: jsonContent(updatePlaylistSchema, "Playlist update data"),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(playlistSchema, "Playlist updated successfully"),
        },
    }),

    deletePlaylist: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/playlists/{playlistId}",
        tags: ["Playlist"],
        middleware: [requirePermission("playlist", ["delete"])] as const,
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
        middleware: [requirePermission("playlist", ["read"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                playlistId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                z.array(playlistMediaItemSchema),
                "Playlist media sequence"
            ),
        },
    }),

    updateSequence: createRoute({
        method: HttpMethods.PUT,
        path: "/orgs/{organizationId}/playlists/{playlistId}/sequence",
        tags: ["Playlist"],
        middleware: [requirePermission("playlist", ["update"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                playlistId: z.string(),
            }),
            body: jsonContent(updateSequenceSchema, "New sequence of media IDs"),
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: {
                description: "Sequence successfully updated",
            },
        },
    }),
};
