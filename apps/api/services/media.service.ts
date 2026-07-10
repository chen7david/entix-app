import { ForbiddenError, NotFoundError } from "@api/errors/app.error";
import type { MediaRepository } from "@api/repositories/media.repository";
import type { UploadService } from "@api/services/upload.service";
import { BaseService } from "./base.service";

export class MediaService extends BaseService {
    constructor(
        private mediaRepo: MediaRepository,
        private uploadService: UploadService
    ) {
        super();
    }

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
        const mediaUpload = await this.uploadService.getUploadById(input.uploadId, organizationId);
        if (!mediaUpload || mediaUpload.status !== "completed") {
            throw new NotFoundError("Media upload not found or not yet completed");
        }

        if (
            !mediaUpload.contentType.startsWith("video/") &&
            !mediaUpload.contentType.startsWith("audio/")
        ) {
            throw new ForbiddenError("Media must be a valid video or audio format");
        }

        let coverArtUrl: string | undefined;

        if (input.coverArtUploadId) {
            coverArtUrl = await this.uploadService.getVerifiedImageUploadUrl(
                input.coverArtUploadId,
                organizationId
            );
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

    async listMedia(
        organizationId: string,
        filters: {
            limit: number;
            cursor?: string;
            direction?: "next" | "prev";
            search?: string;
            type?: "video" | "audio";
        }
    ) {
        return await this.mediaRepo.findAllByOrganization(organizationId, filters);
    }

    async updateMedia(
        organizationId: string,
        mediaId: string,
        updates: { title?: string; description?: string; coverArtUploadId?: string }
    ) {
        let coverArtUrl: string | undefined;

        const currentMedia = await this.getMedia(mediaId, organizationId);

        if (updates.coverArtUploadId) {
            coverArtUrl = await this.uploadService.getVerifiedImageUploadUrl(
                updates.coverArtUploadId,
                organizationId
            );

            if (currentMedia.coverArtUrl) {
                await this.uploadService.deleteUploadByUrlGlobalSafely(currentMedia.coverArtUrl);
            }
        }

        const updated = await this.mediaRepo.update(mediaId, organizationId, {
            ...(updates.title !== undefined ? { title: updates.title } : {}),
            ...(updates.description !== undefined ? { description: updates.description } : {}),
            ...(coverArtUrl !== undefined ? { coverArtUrl } : {}),
        });

        return this.assertExists(updated, "Media not found after update");
    }

    async recordPlay(mediaId: string, organizationId: string) {
        await this.getMedia(mediaId, organizationId); // Verify existence
        await this.mediaRepo.incrementPlayCount(mediaId, organizationId);
    }

    async deleteMedia(mediaId: string, organizationId: string) {
        const media = await this.getMedia(mediaId, organizationId);

        await this.uploadService.deleteUploadByUrlGlobalSafely(media.mediaUrl);

        if (media.coverArtUrl) {
            await this.uploadService.deleteUploadByUrlGlobalSafely(media.coverArtUrl);
        }

        await this.mediaRepo.delete(media.id, organizationId);
    }
}
