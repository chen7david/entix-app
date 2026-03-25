import { createRoute, z } from "@hono/zod-openapi";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";

import { UploadResponseSchema } from "@shared/schemas/dto/upload.dto";
export const OrgUploadsRoutes = {
    requestPresignedUrl: createRoute({
        method: "post",
        path: "/orgs/{organizationId}/uploads",
        tags: ["Organization Uploads"],
        middleware: [
            requirePermission("upload", ["create"]),
        ] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            originalName: z.string().min(1),
                            contentType: z.string().min(1),
                            fileSize: z.number().positive(),
                        }),
                    },
                },
            },
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
    }),

    completeUpload: createRoute({
        method: "post",
        path: "/orgs/{organizationId}/uploads/{uploadId}/complete",
        tags: ["Organization Uploads"],
        middleware: [
            requirePermission("upload", ["update"]),
        ] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                uploadId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: UploadResponseSchema,
                    },
                },
                description: "Upload marked as completed",
            },
        },
    }),

    listUploads: createRoute({
        method: "get",
        path: "/orgs/{organizationId}/uploads",
        tags: ["Organization Uploads"],
        middleware: [] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.array(UploadResponseSchema),
                    },
                },
                description: "Uploads retrieved successfully",
            },
        },
    }),

    deleteUpload: createRoute({
        method: "delete",
        path: "/orgs/{organizationId}/uploads/{uploadId}",
        tags: ["Organization Uploads"],
        middleware: [
            requirePermission("upload", ["delete"]),
        ] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
                uploadId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.NO_CONTENT]: {
                description: "Upload deleted successfully",
            },
            [HttpStatusCodes.NOT_FOUND]: {
                description: "Upload not found",
            },
        },
    }),
};
