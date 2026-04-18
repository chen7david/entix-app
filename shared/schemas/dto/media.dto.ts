import { z } from "@hono/zod-openapi";

export const mediaSchema = z.object({
    id: z.string().openapi({ example: "media_123" }),
    organizationId: z.string().openapi({ example: "org_123" }),
    title: z.string().openapi({ example: "Lesson 1" }),
    description: z.string().nullable().openapi({ example: "Introduction to math" }),
    mimeType: z.string().openapi({ example: "video/mp4" }),
    mediaUrl: z.string().openapi({ example: "https://example.com/video.mp4" }),
    coverArtUrl: z.string().nullable().openapi({ example: "https://example.com/cover.jpg" }),
    playCount: z.number().openapi({ example: 0 }),
    uploadedBy: z.string().openapi({ example: "user_123" }),
    createdAt: z.coerce.date().openapi({ example: "2023-01-01T00:00:00Z" }),
    updatedAt: z.coerce.date().openapi({ example: "2023-01-01T00:00:00Z" }),
});

export type MediaDTO = z.infer<typeof mediaSchema>;
