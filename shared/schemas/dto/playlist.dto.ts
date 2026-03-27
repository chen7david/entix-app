import { z } from '@hono/zod-openapi'
import { baseSchema } from './base.dto'

export const playlistSchema = baseSchema.extend({
    organizationId: z.string().openapi({ example: "org_123" }),
    title: z.string().openapi({ example: "My Favorites" }),
    description: z.string().nullable().openapi({ example: "The best tracks" }),
    coverArtUrl: z.string().nullable().openapi({ example: "https://example.com/cover.jpg" }),
    createdBy: z.string().openapi({ example: "user_123" }),
});

export const playlistMediaItemSchema = z.object({
    playlistId: z.string().openapi({ example: "playlist_123" }),
    mediaId: z.string().openapi({ example: "media_123" }),
    position: z.number().openapi({ example: 1 }),
    addedAt: z.coerce.date().openapi({ example: "2023-01-01T00:00:00Z" }),
});

export const createPlaylistSchema = z.object({
    title: z.string().min(1).max(255).openapi({ example: "New Playlist" }),
    description: z.string().optional().openapi({ example: "A new playlist" }),
    coverArtUploadId: z.string().optional().openapi({ example: "upload_123" }),
});

export const updatePlaylistSchema = createPlaylistSchema.partial();

export const updateSequenceSchema = z.object({
    mediaIds: z.array(z.string()).openapi({ example: ["media_1", "media_2"] }),
});

export type PlaylistDTO = z.infer<typeof playlistSchema>;
export type PlaylistMediaItemDTO = z.infer<typeof playlistMediaItemSchema>;
export type CreatePlaylistDTO = z.infer<typeof createPlaylistSchema>;
export type UpdatePlaylistDTO = z.infer<typeof updatePlaylistSchema>;
export type UpdateSequenceDTO = z.infer<typeof updateSequenceSchema>;
