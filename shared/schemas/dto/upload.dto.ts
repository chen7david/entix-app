import { z } from "@hono/zod-openapi";

export const UploadResponseSchema = z.object({
    id: z.string(),
    originalName: z.string(),
    bucketKey: z.string(),
    url: z.string(),
    fileSize: z.number(),
    contentType: z.string(),
    status: z.enum(["pending", "completed", "failed"]),
    organizationId: z.string(),
    uploadedBy: z.string(),
    createdAt: z.union([z.number(), z.date(), z.string(), z.null()]).optional().transform(d => d ? new Date(d).getTime() : Date.now()),
    updatedAt: z.union([z.number(), z.date(), z.string(), z.null()]).optional().transform(d => d ? new Date(d).getTime() : Date.now()),
}).openapi("UploadResponse");

export type UploadDto = z.infer<typeof UploadResponseSchema>;
