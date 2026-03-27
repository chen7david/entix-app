import { createRoute, z } from "@hono/zod-openapi";
import { HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { requirePermission } from "@api/middleware/require-permission.middleware";

import { UploadResponseSchema, PresignedUrlResponseSchema } from "@shared/schemas/dto/upload.dto";
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
            [HttpStatusCodes.CREATED]: jsonContent(PresignedUrlResponseSchema, "Presigned URL created successfully"),
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
            [HttpStatusCodes.OK]: jsonContent(UploadResponseSchema, "Upload marked as completed"),
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
            [HttpStatusCodes.OK]: jsonContent(z.array(UploadResponseSchema), "Uploads retrieved successfully"),
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
