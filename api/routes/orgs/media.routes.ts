import { createRoute, z } from "@hono/zod-openapi";
import { HttpMethods, HttpStatusCodes } from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireOrgMembership } from "@api/middleware/org-membership.middleware";
import { requirePermission } from "@api/middleware/require-permission.middleware";

const MediaMetadataSchema = z.object({
    source: z.string(),
    externalId: z.string().nullable(),
    externalLikeCount: z.number(),
    externalViewCount: z.number(),
    channelName: z.string().nullable(),
    channelId: z.string().nullable(),
    tags: z.string().nullable(),
    resolution: z.string().nullable().optional(),
    fileSize: z.number().nullable().optional(),
});

const MediaSubtitleSchema = z.object({
    id: z.string(),
    mediaId: z.string(),
    language: z.string(),
    label: z.string(),
    mimeType: z.string(),
    url: z.string(),
    createdAt: z.coerce.date(),
});

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
    metadata: MediaMetadataSchema.nullable().optional(),
    subtitles: z.array(MediaSubtitleSchema).optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

const YouTubeFormatSchema = z.object({
    itag: z.number(),
    qualityLabel: z.string().nullable(),
    bitrate: z.number().nullable(),
    audioBitrate: z.number().nullable(),
    container: z.string(),
    contentLength: z.string().nullable(),
    hasVideo: z.boolean(),
    hasAudio: z.boolean(),
});

const AnalyzeImportResponseSchema = z.object({
    title: z.string(),
    description: z.string().nullable(),
    channelName: z.string().nullable(),
    channelId: z.string().nullable(),
    coverArtUrl: z.string().nullable(),
    externalId: z.string(),
    externalLikeCount: z.number(),
    externalViewCount: z.number(),
    formats: z.array(YouTubeFormatSchema),
});

export const MediaRoutes = {
    listMedia: createRoute({
        method: HttpMethods.GET,
        path: "/orgs/{organizationId}/media",
        tags: ["Media"],
        middleware: [requireAuth, requireOrgMembership] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
            query: z.object({
                type: z.enum(["video", "audio"]).optional(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.array(MediaResponseSchema),
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
        middleware: [
            requireAuth, 
            requireOrgMembership, 
            requirePermission('media', ['create'])
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
        middleware: [
            requireAuth, 
            requireOrgMembership, 
            requirePermission('media', ['update'])
        ] as const,
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
        middleware: [
            requireAuth, 
            requireOrgMembership, 
            requirePermission('media', ['delete'])
        ] as const,
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
        middleware: [requireAuth, requireOrgMembership] as const,
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

    addSubtitle: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/media/{mediaId}/subtitles",
        tags: ["Media Subtitles"],
        middleware: [requireAuth, requireOrgMembership, requirePermission('media', ['update'])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                mediaId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            uploadId: z.string(),
                            language: z.string().min(2).max(10), // e.g. "en", "en-US"
                            label: z.string().min(1).max(50), // e.g. "English", "Spanish (Latin)"
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.CREATED]: {
                content: {
                    "application/json": {
                        schema: MediaSubtitleSchema,
                    },
                },
                description: "Subtitle track added successfully",
            },
        },
    }),

    deleteSubtitle: createRoute({
        method: HttpMethods.DELETE,
        path: "/orgs/{organizationId}/media/{mediaId}/subtitles/{subtitleId}",
        tags: ["Media Subtitles"],
        middleware: [requireAuth, requireOrgMembership, requirePermission('media', ['update'])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                mediaId: z.string(),
                subtitleId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: {
                description: "Subtitle track deleted successfully",
            },
        },
    }),

    updateMetadata: createRoute({
        method: HttpMethods.PATCH,
        path: "/orgs/{organizationId}/media/{mediaId}/metadata",
        tags: ["Media Metadata"],
        middleware: [requireAuth, requireOrgMembership, requirePermission('media', ['update'])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                mediaId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            source: z.string().optional(),
                            externalId: z.string().nullable().optional(),
                            externalLikeCount: z.number().optional(),
                            externalViewCount: z.number().optional(),
                            channelName: z.string().nullable().optional(),
                            channelId: z.string().nullable().optional(),
                            tags: z.array(z.string()).optional(),
                            resolution: z.string().nullable().optional(),
                            fileSize: z.number().nullable().optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: MediaMetadataSchema,
                    },
                },
                description: "Metadata updated successfully",
            },
        },
    }),

    analyzeImport: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/media/imports/analyze",
        tags: ["Media Imports"],
        middleware: [requireAuth, requireOrgMembership, requirePermission('media', ['create'])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({ url: z.string().url() }),
                    },
                },
            },
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: AnalyzeImportResponseSchema,
                    },
                },
                description: "Analysis complete",
            },
        },
    }),

    executeImport: createRoute({
        method: HttpMethods.POST,
        path: "/orgs/{organizationId}/media/imports/execute",
        tags: ["Media Imports"],
        middleware: [requireAuth, requireOrgMembership, requirePermission('media', ['create'])] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({ 
                            url: z.string().url(),
                            formatItag: z.number(),
                            metadata: z.any().optional(),
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
                description: "Media imported synchronously",
            },
        },
    }),
};
