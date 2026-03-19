import { PlaylistRepository } from "@api/repositories/playlist.repository";
import { UploadService } from "@api/services/upload.service";
import { NotFoundError, ForbiddenError } from "@api/errors/app.error";

export class PlaylistService {
    constructor(
        private playlistRepo: PlaylistRepository,
        private uploadService: UploadService
    ) { }

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
            const coverUpload = await this.uploadService.getUploadById(input.coverArtUploadId, organizationId);
            if (!coverUpload || coverUpload.status !== "completed") {
                throw new NotFoundError("Cover art upload not found or not yet completed");
            }
            if (!coverUpload.contentType.startsWith("image/")) {
                throw new ForbiddenError("Cover art must be an image");
            }
            coverArtUrl = coverUpload.url;
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
            const coverUpload = await this.uploadService.getUploadById(updates.coverArtUploadId, organizationId);
            if (!coverUpload || coverUpload.status !== "completed") throw new NotFoundError("Cover art upload missing");
            coverArtUrl = coverUpload.url;

            // Clean up old cover artifact globally if replaced
            if (currentPlaylist.coverArtUrl) {
                const oldCover = await this.uploadService.getUploadByUrlGlobal(currentPlaylist.coverArtUrl);
                if (oldCover) {
                    try { await this.uploadService.deleteUploadGlobal(oldCover.id); } catch {}
                }
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
            const coverUpload = await this.uploadService.getUploadByUrlGlobal(playlist.coverArtUrl);
            if (coverUpload) {
                try { await this.uploadService.deleteUploadGlobal(coverUpload.id); } catch {}
            }
        }

        await this.playlistRepo.delete(playlist.id, organizationId);
    }

    async setPlaylistSequence(playlistId: string, organizationId: string, mediaIds: string[]) {
        // Must verify existence and permissions first
        await this.getPlaylist(playlistId, organizationId);
        
        // Push atomic sequence to repository
        await this.playlistRepo.setMediaSequence(playlistId, mediaIds);
    }

    async getPlaylistSequence(playlistId: string, organizationId: string) {
        // Enforce org bounds
        await this.getPlaylist(playlistId, organizationId);
        
        return await this.playlistRepo.getMediaSequence(playlistId);
    }
}
