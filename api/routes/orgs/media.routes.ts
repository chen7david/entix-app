import { HttpMethods, HttpStatusCodes } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";
import { createRoute, z } from "@hono/zod-openapi";
import {
    createPaginatedResponseSchema,
    PaginationQuerySchema,
} from "@shared/schemas/pagination.schema";

const MediaResponseSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    mimeType: z.string(),
    mediaUrl: z.string(),
    coverArtUrl: z.string().nullable(),
    playCount: z.number(),
    uploadedBy: z.string(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export const MediaRoutes = {
    listMedia: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/media",
        tags: ["Media"],
        middleware: [requirePermission("media", ["read"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
            query: z
                .object({
                    type: z.enum(["video", "audio"]).optional(),
                })
                .merge(PaginationQuerySchema),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.object({
                            data: createPaginatedResponseSchema(MediaResponseSchema),
                        }),
                    },
                },
                description: "List of media files",
            },
        },
    }),

    createMedia: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/media",
        tags: ["Media"],
        middleware: [requirePermission("media", ["create"])] as const,
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
                            uploadId: z.string(),
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
                        schema: MediaResponseSchema,
                    },
                },
                description: "Media created successfully",
            },
        },
    }),

    updateMedia: createRoute({
        method: HttpMethods.PATCH,
        path: "/orgs/{organizationId}/media/{mediaId}",
        tags: ["Media"],
        middleware: [requirePermission("media", ["update"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                mediaId: z.string(),
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
                        schema: MediaResponseSchema,
                    },
                },
                description: "Media updated successfully",
            },
        },
    }),

    deleteMedia: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/media/{mediaId}",
        tags: ["Media"],
        middleware: [requirePermission("media", ["delete"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                mediaId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: {
                description: "Media deleted successfully",
            },
        },
    }),

    recordPlay: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/media/{mediaId}/play",
        tags: ["Media"],
        middleware: [requirePermission("media", ["read"])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                mediaId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: {
                description: "Play count incremented successfully",
            },
        },
    }),
};
