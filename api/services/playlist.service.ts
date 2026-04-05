import type { PlaylistRepository } from "@api/repositories/playlist.repository";
import type { UploadService } from "@api/services/upload.service";
import type * as schema from "@shared/db/schema";
import { BaseService } from "./base.service";

export class PlaylistService extends BaseService {
    constructor(
        private playlistRepo: PlaylistRepository,
        private uploadService: UploadService
    ) {
        super();
    }

    /**
     * Create a new playlist.
     */
    async createPlaylist(
        organizationId: string,
        userId: string,
        input: {
            title: string;
            description?: string;
            coverArtUploadId?: string;
        }
    ) {
        let coverArtUrl: string | undefined;

        if (input.coverArtUploadId) {
            coverArtUrl = await this.uploadService.getVerifiedImageUploadUrl(
                input.coverArtUploadId,
                organizationId
            );
        }

        return await this.playlistRepo.create({
            id: crypto.randomUUID(),
            organizationId,
            title: input.title,
            description: input.description,
            coverArtUrl,
            createdBy: userId,
        });
    }

    /**
     * Find a playlist by ID (returns null if not found).
     */
    async findPlaylistById(
        playlistId: string,
        organizationId: string
    ): Promise<schema.Playlist | null> {
        return await this.playlistRepo.findPlaylistById(playlistId, organizationId);
    }

    /**
     * Get a playlist by ID (throws NotFoundError if not found).
     */
    async getPlaylist(playlistId: string, organizationId: string): Promise<schema.Playlist> {
        const playlist = await this.findPlaylistById(playlistId, organizationId);
        return this.assertExists(playlist, "Playlist not found");
    }

    /**
     * List all playlists for an organization.
     */
    async listPlaylists(organizationId: string) {
        return await this.playlistRepo.findPlaylistsByOrganization(organizationId);
    }

    /**
     * Update an existing playlist.
     */
    async updatePlaylist(
        organizationId: string,
        playlistId: string,
        updates: { title?: string; description?: string; coverArtUploadId?: string }
    ): Promise<schema.Playlist> {
        const currentPlaylist = await this.getPlaylist(playlistId, organizationId);
        let coverArtUrl: string | undefined;

        if (updates.coverArtUploadId) {
            coverArtUrl = await this.uploadService.getVerifiedImageUploadUrl(
                updates.coverArtUploadId,
                organizationId
            );

            if (currentPlaylist.coverArtUrl) {
                await this.uploadService.deleteUploadByUrlGlobalSafely(currentPlaylist.coverArtUrl);
            }
        }

        const updated = await this.playlistRepo.update(playlistId, organizationId, {
            ...(updates.title !== undefined ? { title: updates.title } : {}),
            ...(updates.description !== undefined ? { description: updates.description } : {}),
            ...(coverArtUrl !== undefined ? { coverArtUrl } : {}),
        });

        return this.assertExists(updated, "Failed to retrieve updated playlist");
    }

    /**
     * Delete a playlist and its associated cover art.
     */
    async deletePlaylist(playlistId: string, organizationId: string) {
        const playlist = await this.getPlaylist(playlistId, organizationId);

        if (playlist.coverArtUrl) {
            await this.uploadService.deleteUploadByUrlGlobalSafely(playlist.coverArtUrl);
        }

        await this.playlistRepo.delete(playlist.id, organizationId);
    }

    /**
     * Set the sequence of media items in a playlist.
     */
    async setPlaylistSequence(playlistId: string, organizationId: string, mediaIds: string[]) {
        await this.getPlaylist(playlistId, organizationId);
        await this.playlistRepo.setMediaSequence(playlistId, mediaIds);
    }

    /**
     * Get the sequence of media items in a playlist.
     */
    async getPlaylistSequence(playlistId: string, organizationId: string) {
        await this.getPlaylist(playlistId, organizationId);
        return await this.playlistRepo.findMediaSequence(playlistId);
    }
}
