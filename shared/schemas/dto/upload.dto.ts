import { z } from "@hono/zod-openapi";

export const UploadResponseSchema = z.object({
    id: z.string(),
    originalName: z.string(),
    bucketKey: z.string(),
    url: z.string().url(),
    fileSize: z.number(),
    contentType: z.string(),
    status: z.enum(["pending", "completed", "failed"]),
    organizationId: z.string(),
    uploadedBy: z.string(),
    createdAt: z.number().or(z.date()).transform(d => new Date(d).getTime()),
    updatedAt: z.number().or(z.date()).transform(d => new Date(d).getTime()),
}).openapi("UploadResponse");

export type UploadDto = z.infer<typeof UploadResponseSchema>;
