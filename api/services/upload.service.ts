import { BucketService } from "./bucket.service";
import { UploadRepository } from "@api/repositories/upload.repository";
import { NotFoundError, ForbiddenError } from "@api/errors/app.error";

export class UploadService {
    constructor(
        private bucketService: BucketService,
        private uploadRepo: UploadRepository,
        private publicUrlPrefix: string
    ) { }

    async createPresignedUrl(
        organizationId: string,
        userId: string,
        originalName: string,
        contentType: string,
        fileSize: number
    ) {
        // Use UUID for security and scalability, hide original name
        const uploadId = crypto.randomUUID();
        const extMatch = originalName.match(/\.[0-9a-z]+$/i);
        const ext = extMatch ? extMatch[0].toLowerCase() : '';
        const bucketKey = `${organizationId}/${uploadId}${ext}`;

        // expiresIn defaults to 3600 internally
        const presignedUrl = await this.bucketService.getPresignedUploadUrl(bucketKey);

        const uploadRecord = await this.uploadRepo.create({
            id: uploadId,
            originalName,
            bucketKey,
            url: bucketKey,
            fileSize,
            contentType,
            organizationId,
            uploadedBy: userId,
            status: "pending"
        });

        return {
            uploadId: uploadRecord.id,
            presignedUrl,
            url: `${this.publicUrlPrefix}/${bucketKey}`,
            bucketKey: uploadRecord.bucketKey
        };
    }

    async getUploadById(uploadId: string, organizationId: string) {
        const record = await this.uploadRepo.findById(uploadId, organizationId);
        if (!record) return undefined;
        return {
            ...record,
            url: `${this.publicUrlPrefix}/${record.bucketKey}`
        };
    }

    async getUploadByUrl(absoluteUrl: string, organizationId: string) {
        let relativeUrl = absoluteUrl;
        const prefixWithSlash = `${this.publicUrlPrefix}/`;
        if (absoluteUrl.startsWith(prefixWithSlash)) {
            relativeUrl = absoluteUrl.substring(prefixWithSlash.length);
        } else if (absoluteUrl.startsWith(this.publicUrlPrefix)) {
            relativeUrl = absoluteUrl.substring(this.publicUrlPrefix.length);
        }

        const record = await this.uploadRepo.findByUrl(relativeUrl, organizationId);
        if (!record) return undefined;

        return {
            ...record,
            url: `${this.publicUrlPrefix}/${record.bucketKey}`
        };
    }

    async completeUpload(uploadId: string, organizationId: string) {
        const record = await this.uploadRepo.updateStatus(uploadId, organizationId, "completed");
        if (!record) {
            throw new NotFoundError("Upload not found");
        }
        return {
            ...record,
            url: `${this.publicUrlPrefix}/${record.bucketKey}`
        };
    }

    async deleteUpload(uploadId: string, organizationId: string) {
        const record = await this.uploadRepo.findById(uploadId, organizationId);
        if (!record) return false;

        // delete from R2 - will throw on critical failures
        // Success (2xx) or Ghost Object (404) will proceed
        await this.bucketService.delete(record.bucketKey);

        // delete from DB
        return await this.uploadRepo.delete(uploadId, organizationId);
    }

    async listUploads(organizationId: string) {
        const uploads = await this.uploadRepo.findAllByOrganization(organizationId);
        return uploads.map(u => ({
            ...u,
            url: `${this.publicUrlPrefix}/${u.bucketKey}`
        }));
    }

    async getUploadByUrlGlobal(absoluteUrl: string) {
        let relativeUrl = absoluteUrl;
        const prefixWithSlash = `${this.publicUrlPrefix}/`;
        if (absoluteUrl.startsWith(prefixWithSlash)) {
            relativeUrl = absoluteUrl.substring(prefixWithSlash.length);
        } else if (absoluteUrl.startsWith(this.publicUrlPrefix)) {
            relativeUrl = absoluteUrl.substring(this.publicUrlPrefix.length);
        }

        const record = await this.uploadRepo.findByUrlGlobal(relativeUrl);
        if (!record) return undefined;

        return {
            ...record,
            url: `${this.publicUrlPrefix}/${record.bucketKey}`
        };
    }

    async deleteUploadGlobal(uploadId: string) {
        const record = await this.uploadRepo.findByIdGlobal(uploadId);
        if (!record) return false;

        // delete from R2
        await this.bucketService.delete(record.bucketKey);

        // delete from DB
        return await this.uploadRepo.deleteGlobal(uploadId);
    }

    // Abstraction Helpers to DRY up business services
    async getVerifiedImageUploadUrl(uploadId: string, organizationId: string): Promise<string> {
        const upload = await this.getUploadById(uploadId, organizationId);
        if (!upload || upload.status !== "completed") {
            throw new NotFoundError("Cover art upload not found or not yet completed");
        }
        if (!upload.contentType.startsWith("image/")) {
            throw new ForbiddenError("Cover art must be an image");
        }
        return upload.url;
    }

    async deleteUploadByUrlGlobalSafely(url: string): Promise<void> {
        const uploadRecord = await this.getUploadByUrlGlobal(url);
        if (uploadRecord) {
            try { 
                await this.deleteUploadGlobal(uploadRecord.id); 
            } catch (err) {
                // Silently swallow cascade deletion errors on R2 hooks
            }
        }
    }
}
