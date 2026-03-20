import { MediaRepository } from "@api/repositories/media.repository";
import { UploadService } from "@api/services/upload.service";
import { NotFoundError, ForbiddenError } from "@api/errors/app.error";

import { MediaSubtitleRepository } from "@api/repositories/media-subtitle.repository";
import { MediaMetadataRepository } from "@api/repositories/media-metadata.repository";

export class MediaService {
    constructor(
        private mediaRepo: MediaRepository,
        private uploadService: UploadService,
        private subtitleRepo: MediaSubtitleRepository,
        private metadataRepo: MediaMetadataRepository
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
            coverArtUrl = await this.uploadService.getVerifiedImageUploadUrl(input.coverArtUploadId, organizationId);
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

    async listMedia(organizationId: string, type?: "video" | "audio") {
        return await this.mediaRepo.findAllByOrganization(organizationId, type);
    }

    async updateMedia(
        organizationId: string,
        mediaId: string,
        updates: { title?: string; description?: string; coverArtUploadId?: string }
    ) {
        let coverArtUrl: string | undefined;

        const currentMedia = await this.getMedia(mediaId, organizationId);

        if (updates.coverArtUploadId) {
            coverArtUrl = await this.uploadService.getVerifiedImageUploadUrl(updates.coverArtUploadId, organizationId);

            // Delete old cover art if it existed
            if (currentMedia.coverArtUrl) {
                await this.uploadService.deleteUploadByUrlGlobalSafely(currentMedia.coverArtUrl);
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
        await this.uploadService.deleteUploadByUrlGlobalSafely(media.mediaUrl);

        // Delete cover art permanently
        if (media.coverArtUrl) {
            await this.uploadService.deleteUploadByUrlGlobalSafely(media.coverArtUrl);
        }

        // Delete from Drizzle
        await this.mediaRepo.delete(media.id, organizationId);
    }

    // ---------------------------------------------------------------------------
    // Subtitle Management
    // ---------------------------------------------------------------------------

    async addSubtitle(
        organizationId: string,
        mediaId: string,
        payload: { uploadId: string; language: string; label: string }
    ) {
        // Authenticate media ownership
        await this.getMedia(mediaId, organizationId);

        // Verify the VTT upload
        const vttUpload = await this.uploadService.getUploadById(payload.uploadId, organizationId);
        if (!vttUpload || vttUpload.status !== "completed") {
            throw new NotFoundError("Subtitle upload not found or not yet completed");
        }
        
        // Strict VTT enforcement
        if (!vttUpload.contentType.includes("vtt")) {
            throw new ForbiddenError("Subtitles must be strictly in text/vtt format.");
        }

        return await this.subtitleRepo.create({
            id: crypto.randomUUID(),
            mediaId,
            language: payload.language,
            label: payload.label,
            mimeType: "text/vtt",
            url: vttUpload.url
        });
    }

    async deleteSubtitle(organizationId: string, mediaId: string, subtitleId: string) {
        await this.getMedia(mediaId, organizationId);
        const subtitle = await this.subtitleRepo.getById(subtitleId);
        if (!subtitle || subtitle.mediaId !== mediaId) {
            throw new NotFoundError("Subtitle not found");
        }
        
        // Wipe from Cloudflare R2
        await this.uploadService.deleteUploadByUrlGlobalSafely(subtitle.url);
        // Wipe from D1
        await this.subtitleRepo.delete(subtitleId);
    }

    // ---------------------------------------------------------------------------
    // Metadata Analytics Mapping
    // ---------------------------------------------------------------------------

    async updateMetadata(organizationId: string, mediaId: string, metadata: {
        source?: string;
        externalId?: string;
        externalLikeCount?: number;
        externalViewCount?: number;
        channelName?: string;
        channelId?: string;
        tags?: string[];
    }) {
        await this.getMedia(mediaId, organizationId);
        return await this.metadataRepo.upsert(mediaId, {
            ...metadata,
            tags: metadata.tags ? JSON.stringify(metadata.tags) : undefined
        });
    }
}
