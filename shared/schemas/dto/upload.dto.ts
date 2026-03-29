import { z } from "@hono/zod-openapi";

export const stableTimestamp = (d: any) => {
    if (!d) return null;
    const ts = new Date(d).getTime();
    return Number.isFinite(ts) ? ts : null;
};

export const UploadResponseSchema = z
    .object({
        id: z.string(),
        originalName: z.string(),
        bucketKey: z.string(),
        url: z.string(),
        fileSize: z.number(),
        contentType: z.string(),
        status: z.enum(["pending", "completed", "failed"]),
        organizationId: z.string(),
        uploadedBy: z.string(),
        createdAt: z
            .union([z.number(), z.date(), z.string(), z.null()])
            .optional()
            .transform(stableTimestamp)
            .nullable(),
        updatedAt: z
            .union([z.number(), z.date(), z.string(), z.null()])
            .optional()
            .transform(stableTimestamp)
            .nullable(),
    })
    .openapi("UploadResponse");

export const PresignedUrlResponseSchema = z
    .object({
        uploadId: z.string(),
        presignedUrl: z.string(),
        url: z.string(),
        bucketKey: z.string(),
    })
    .openapi("PresignedUrlResponse");

export const UploadCompleteResponseSchema = z
    .object({
        id: z.string(),
        url: z.string(),
        status: z.string(),
    })
    .openapi("UploadCompleteResponse");

export type UploadDto = z.infer<typeof UploadResponseSchema>;
export type PresignedUrlResponseDto = z.infer<typeof PresignedUrlResponseSchema>;
export type UploadCompleteResponseDto = z.infer<typeof UploadCompleteResponseSchema>;
