import { createRoute, z } from "@hono/zod-openapi";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireOrgMembership } from "@api/middleware/org-membership.middleware";
import { requirePermission } from "@api/middleware/require-permission.middleware";

export const uploadSchema = z.object({
    id: z.string(),
    originalName: z.string(),
    bucketKey: z.string(),
    url: z.string(),
    fileSize: z.number(),
    contentType: z.string(),
    status: z.enum(["pending", "completed", "failed"]),
    organizationId: z.string(),
    uploadedBy: z.string(),
    createdAt: z.number().or(z.date()).transform(d => new Date(d).getTime()),
    updatedAt: z.number().or(z.date()).transform(d => new Date(d).getTime()),
});

export const OrgUploadsRoutes = {
    requestPresignedUrl: createRoute({
        method: "post",
        path: "/orgs/{organizationId}/uploads",
        tags: ["Organization Uploads"],
        middleware: [
            requireAuth,
            requireOrgMembership,
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
            requireAuth,
            requireOrgMembership,
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
                        schema: uploadSchema,
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
        middleware: [
            requireAuth,
            requireOrgMembership,
        ] as const,
        request: {
            params: z.object({
                organizationId: z.string(),
            }),
        },
        responses: {
            [HttpStatusCodes.OK]: {
                content: {
                    "application/json": {
                        schema: z.array(uploadSchema),
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
            requireAuth,
            requireOrgMembership,
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
