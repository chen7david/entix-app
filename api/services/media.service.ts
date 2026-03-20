import { MediaRepository } from "@api/repositories/media.repository";
import { UploadService } from "@api/services/upload.service";
import { NotFoundError, ForbiddenError } from "@api/errors/app.error";

import { MediaSubtitleRepository } from "@api/repositories/media-subtitle.repository";
import { MediaMetadataRepository } from "@api/repositories/media-metadata.repository";
// @ts-expect-error Temporary workaround for inner types.d.ts error inside ytdl-core-enhanced
import ytdl from "ytdl-core-enhanced";

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
        externalId?: string | null;
        externalLikeCount?: number;
        externalViewCount?: number;
        channelName?: string | null;
        channelId?: string | null;
        tags?: string[];
        resolution?: string | null;
        fileSize?: number | null;
    }) {
        await this.getMedia(mediaId, organizationId);
        return await this.metadataRepo.upsert(mediaId, {
            ...metadata,
            tags: metadata.tags ? JSON.stringify(metadata.tags) : undefined
        });
    }

    // ---------------------------------------------------------------------------
    // YouTube YTDL-Core Importer Pipeline
    // ---------------------------------------------------------------------------

    async analyzeYouTubeUrl(url: string) {
        try {
            const info = await ytdl.getInfo(url);
            
            const formats = info.formats.map(f => ({
                itag: f.itag,
                qualityLabel: f.qualityLabel || null,
                bitrate: f.bitrate || null,
                audioBitrate: f.audioBitrate || null,
                container: f.container || 'unknown',
                contentLength: f.contentLength || null,
                hasVideo: f.hasVideo,
                hasAudio: f.hasAudio
            }));

            const videoDetails = info.videoDetails;

            return {
                title: videoDetails.title,
                description: videoDetails.description || null,
                channelName: videoDetails.author.name || null,
                channelId: videoDetails.author.id || null,
                coverArtUrl: videoDetails.thumbnails.length > 0 ? videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url : null,
                externalId: videoDetails.videoId,
                externalLikeCount: videoDetails.likes || 0,
                externalViewCount: Number(videoDetails.viewCount) || 0,
                formats
            };
        } catch (error: any) {
            if (error.message.includes("playable formats")) {
                throw new ForbiddenError("YouTube Edge CDN temporarily blocked this extraction request (IP ban or Cipher shift). Please try another video or await upstream patches for ytdl-core.");
            }
            throw new Error(`Failed to safely map YouTube metadata manifest: ${error.message}`);
        }
    }

    async executeYouTubeImport(
        organizationId: string,
        userId: string,
        url: string,
        formatItag: number,
        analyzedMetadata?: any
    ) {
        // 1. Fetch manifest
        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: formatItag });

        if (!format || !format.url) {
            throw new Error("The requested media format was immediately entirely unavailable on YouTube's Edge CDN.");
        }

        // 2. Generate UUID mapping for R2
        const mediaId = crypto.randomUUID();
        const extension = format.hasVideo && format.hasAudio ? 'mp4' : (format.hasVideo ? 'mp4' : 'mp3');
        const bucketKey = `${organizationId}/media/imports/${mediaId}.${extension}`;
        
        // 3. Open ReadStream from YouTube Edge (Fetch)
        const response = await fetch(format.url);
        
        if (!response.body) {
            throw new Error("YouTube Edge CDN failed to return a valid readable stream buffer.");
        }

        const exactMime = format.hasVideo ? 'video/mp4' : 'audio/mpeg';
        const exactSize = format.contentLength ? parseInt(format.contentLength, 10) : 0;

        // 4. Pipe instantly to R2 using Native WebStream Wrapper
        const uploadObj = await this.uploadService.uploadStreamToR2(
            bucketKey,
            response.body,
            exactMime,
            exactSize,
            organizationId,
            userId
        );

        // 5. Build Cover Art
        let finalCoverArtUrl: string | undefined = undefined;
        
        const bestThumb = info.videoDetails.thumbnails.length > 0 
            ? info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1] 
            : null;

        if (bestThumb) {
            try {
                const thumbRes = await fetch(bestThumb.url);
                if (thumbRes.body) {
                    const thumbKey = `${organizationId}/media/covers/${mediaId}.jpg`;
                    const thumbUpload = await this.uploadService.uploadStreamToR2(
                        thumbKey,
                        thumbRes.body,
                        'image/jpeg',
                        0,
                        organizationId,
                        userId
                    );
                    finalCoverArtUrl = thumbUpload.url;
                }
            } catch (e) {
                // Safely ignore cover art failures
            }
        }

        // 6. Register Media Row
        const media = await this.mediaRepo.create({
            id: mediaId,
            organizationId,
            title: analyzedMetadata?.title || info.videoDetails.title || 'Unknown Import',
            description: analyzedMetadata?.description || info.videoDetails.description || null,
            mimeType: exactMime,
            mediaUrl: uploadObj.url,
            coverArtUrl: finalCoverArtUrl,
            uploadedBy: userId,
        });

        // 7. Inject YouTube analytics payload
        await this.metadataRepo.upsert(media.id, {
            source: 'youtube',
            externalId: info.videoDetails.videoId,
            externalLikeCount: info.videoDetails.likes || 0,
            externalViewCount: Number(info.videoDetails.viewCount) || 0,
            channelName: info.videoDetails.author.name || null,
            channelId: info.videoDetails.author.id || null,
            resolution: format.qualityLabel || null,
            fileSize: exactSize
        });

        // 8. Eager fetch final assembled entity
        return await this.getMedia(media.id, organizationId);
    }
}
