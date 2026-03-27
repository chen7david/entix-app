import { NotFoundError } from "@api/errors/app.error";
import type { PlaylistRepository } from "@api/repositories/playlist.repository";
import type { UploadService } from "@api/services/upload.service";

export class PlaylistService {
    constructor(
        private playlistRepo: PlaylistRepository,
        private uploadService: UploadService
    ) {}

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

    async getPlaylist(playlistId: string, organizationId: string) {
        const playlist = await this.playlistRepo.findById(playlistId, organizationId);
        if (!playlist) throw new NotFoundError("Playlist not found");
        return playlist;
    }

    async listPlaylists(organizationId: string) {
        return await this.playlistRepo.findAllByOrganization(organizationId);
    }

    async updatePlaylist(
        organizationId: string,
        playlistId: string,
        updates: { title?: string; description?: string; coverArtUploadId?: string }
    ) {
        let coverArtUrl: string | undefined;

        const currentPlaylist = await this.getPlaylist(playlistId, organizationId);

        if (updates.coverArtUploadId) {
            coverArtUrl = await this.uploadService.getVerifiedImageUploadUrl(
                updates.coverArtUploadId,
                organizationId
            );

            if (currentPlaylist.coverArtUrl) {
                await this.uploadService.deleteUploadByUrlGlobalSafely(currentPlaylist.coverArtUrl);
            }
        }

        return await this.playlistRepo.update(playlistId, organizationId, {
            ...(updates.title !== undefined ? { title: updates.title } : {}),
            ...(updates.description !== undefined ? { description: updates.description } : {}),
            ...(coverArtUrl !== undefined ? { coverArtUrl } : {}),
        });
    }

    async deletePlaylist(playlistId: string, organizationId: string) {
        const playlist = await this.getPlaylist(playlistId, organizationId);

        if (playlist.coverArtUrl) {
            await this.uploadService.deleteUploadByUrlGlobalSafely(playlist.coverArtUrl);
        }

        await this.playlistRepo.delete(playlist.id, organizationId);
    }

    async setPlaylistSequence(playlistId: string, organizationId: string, mediaIds: string[]) {
        await this.getPlaylist(playlistId, organizationId);

        await this.playlistRepo.setMediaSequence(playlistId, mediaIds);
    }

    async getPlaylistSequence(playlistId: string, organizationId: string) {
        await this.getPlaylist(playlistId, organizationId);

        return await this.playlistRepo.getMediaSequence(playlistId);
    }
}
