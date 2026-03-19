import { MediaRepository } from "@api/repositories/media.repository";
import { UploadService } from "@api/services/upload.service";
import { NotFoundError, ForbiddenError } from "@api/errors/app.error";

export class MediaService {
    constructor(
        private mediaRepo: MediaRepository,
        private uploadService: UploadService
    ) { }

    async createMedia(
        organizationId: string, 
        userId: string, 
        input: {
            title: string;
            description?: string;
            uploadId: string;
            coverArtUploadId?: string;
        }
    ) {
        // Enforce the main media payload is a completed upload
        const mediaUpload = await this.uploadService.getUploadById(input.uploadId, organizationId);
        if (!mediaUpload || mediaUpload.status !== "completed") {
            throw new NotFoundError("Media upload not found or not yet completed");
        }

        // Validate MIME type
        if (!mediaUpload.contentType.startsWith("video/") && !mediaUpload.contentType.startsWith("audio/")) {
            throw new ForbiddenError("Media must be a valid video or audio format");
        }

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

        return await this.mediaRepo.create({
            id: crypto.randomUUID(),
            organizationId,
            title: input.title,
            description: input.description,
            mimeType: mediaUpload.contentType,
            mediaUrl: mediaUpload.url,
            coverArtUrl,
            uploadedBy: userId,
        });
    }

    async getMedia(mediaId: string, organizationId: string) {
        const media = await this.mediaRepo.findById(mediaId, organizationId);
        if (!media) throw new NotFoundError("Media not found");
        return media;
    }

    async listMedia(organizationId: string) {
        return await this.mediaRepo.findAllByOrganization(organizationId);
    }

    async updateMedia(
        organizationId: string,
        mediaId: string,
        updates: { title?: string; description?: string; coverArtUploadId?: string }
    ) {
        let coverArtUrl: string | undefined;

        const currentMedia = await this.getMedia(mediaId, organizationId);

        if (updates.coverArtUploadId) {
            const coverUpload = await this.uploadService.getUploadById(updates.coverArtUploadId, organizationId);
            if (!coverUpload || coverUpload.status !== "completed") throw new NotFoundError("Cover art upload missing");
            coverArtUrl = coverUpload.url;

            // Delete old cover art if it existed
            if (currentMedia.coverArtUrl) {
                const oldCover = await this.uploadService.getUploadByUrlGlobal(currentMedia.coverArtUrl);
                if (oldCover) {
                    try { await this.uploadService.deleteUploadGlobal(oldCover.id); } catch {}
                }
            }
        }

        return await this.mediaRepo.update(mediaId, organizationId, {
            ...(updates.title !== undefined ? { title: updates.title } : {}),
            ...(updates.description !== undefined ? { description: updates.description } : {}),
            ...(coverArtUrl !== undefined ? { coverArtUrl } : {}),
        });
    }

    async recordPlay(mediaId: string, organizationId: string) {
        await this.getMedia(mediaId, organizationId); // Verify existence
        await this.mediaRepo.incrementPlayCount(mediaId, organizationId);
    }

    async deleteMedia(mediaId: string, organizationId: string) {
        const media = await this.getMedia(mediaId, organizationId);

        // Discard the actual video/audio file permanently via global bucket wipe
        const mediaUpload = await this.uploadService.getUploadByUrlGlobal(media.mediaUrl);
        if (mediaUpload) {
            try { await this.uploadService.deleteUploadGlobal(mediaUpload.id); } catch {}
        }

        // Delete cover art permanently
        if (media.coverArtUrl) {
            const coverUpload = await this.uploadService.getUploadByUrlGlobal(media.coverArtUrl);
            if (coverUpload) {
                try { await this.uploadService.deleteUploadGlobal(coverUpload.id); } catch {}
            }
        }

        // Delete from Drizzle
        await this.mediaRepo.delete(media.id, organizationId);
    }
}
