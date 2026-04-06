import { ForbiddenError, NotFoundError } from "@api/errors/app.error";
import type { UploadRepository, UserUploadRepository } from "@api/repositories/upload.repository";
import { BaseService } from "./base.service";
import type { BucketService } from "./bucket.service";

export class UploadService extends BaseService {
    constructor(
        private bucketService: BucketService,
        private uploadRepo: UploadRepository,
        private userUploadRepo: UserUploadRepository,
        private publicUrlPrefix: string
    ) {
        super();
    }

    /**
     * Create a presigned URL for an organization-scoped upload.
     */
    async createPresignedUrl(
        storagePrefix: string,
        organizationId: string,
        userId: string,
        originalName: string,
        contentType: string,
        fileSize: number
    ) {
        const uploadId = crypto.randomUUID();
        const extMatch = originalName.match(/\.[0-9a-z]+$/i);
        const ext = extMatch ? extMatch[0].toLowerCase() : "";
        const bucketKey = `${storagePrefix}/${uploadId}${ext}`;

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
            status: "pending",
        });

        return {
            uploadId: uploadRecord.id,
            presignedUrl,
            url: `${this.publicUrlPrefix}/${bucketKey}`,
            bucketKey: uploadRecord.bucketKey,
        };
    }

    /**
     * Mark an organization-scoped upload as completed.
     */
    async completeUpload(uploadId: string, organizationId: string) {
        const record = await this.uploadRepo.updateStatus(uploadId, organizationId, "completed");
        if (!record) {
            throw new NotFoundError("Upload not found");
        }
        return {
            ...record,
            url: `${this.publicUrlPrefix}/${record.bucketKey}`,
        };
    }

    /**
     * Find an organization-scoped upload (returns null if not found).
     */
    async findUploadById(uploadId: string, organizationId: string) {
        const record = await this.uploadRepo.findUploadById(uploadId, organizationId);
        if (!record) return null;
        return {
            ...record,
            url: `${this.publicUrlPrefix}/${record.bucketKey}`,
        };
    }

    /**
     * Get an organization-scoped upload (throws NotFoundError if not found).
     */
    async getUploadById(uploadId: string, organizationId: string) {
        const upload = await this.findUploadById(uploadId, organizationId);
        return this.assertExists(upload, `Upload ${uploadId} not found`);
    }

    /**
     * List organization-scoped uploads with cursor pagination, search, and type filter.
     */
    async listUploads(
        organizationId: string,
        filters: {
            search?: string;
            type?: string;
            cursor?: string;
            limit?: number;
            direction?: "next" | "prev";
        } = {}
    ) {
        const result = await this.uploadRepo.findUploadsPaginated(organizationId, filters);
        return {
            ...result,
            items: result.items.map((u) => ({
                ...u,
                url: `${this.publicUrlPrefix}/${u.bucketKey}`,
            })),
        };
    }

    /**
     * Delete an organization-scoped upload and its remote physical file.
     */
    async deleteUpload(uploadId: string, organizationId: string): Promise<boolean> {
        const record = await this.uploadRepo.findUploadById(uploadId, organizationId);
        if (record) {
            await this.bucketService.delete(record.bucketKey);
            return await this.uploadRepo.delete(uploadId, organizationId);
        }
        return false;
    }

    /**
     * Create a presigned URL for a user-scoped upload (e.g., avatar).
     */
    async createUserUploadPresignedUrl(
        storagePrefix: string,
        userId: string,
        originalName: string,
        contentType: string,
        fileSize: number
    ) {
        const uploadId = crypto.randomUUID();
        const extMatch = originalName.match(/\.[0-9a-z]+$/i);
        const ext = extMatch ? extMatch[0].toLowerCase() : "";
        const bucketKey = `${storagePrefix}/${uploadId}${ext}`;

        const presignedUrl = await this.bucketService.getPresignedUploadUrl(bucketKey);

        const uploadRecord = await this.userUploadRepo.create({
            id: uploadId,
            userId,
            originalName,
            bucketKey,
            url: bucketKey,
            fileSize,
            contentType,
            status: "pending",
        });

        return {
            uploadId: uploadRecord.id,
            presignedUrl,
            url: `${this.publicUrlPrefix}/${bucketKey}`,
            bucketKey: uploadRecord.bucketKey,
        };
    }

    /**
     * Mark a user-scoped upload as completed.
     */
    async completeUserUpload(uploadId: string, userId: string) {
        const record = await this.userUploadRepo.updateStatus(uploadId, userId, "completed");
        if (!record) {
            throw new NotFoundError("User upload not found");
        }
        return {
            ...record,
            url: `${this.publicUrlPrefix}/${record.bucketKey}`,
        };
    }

    /**
     * Find a user-scoped upload (returns null if not found).
     */
    async findUserUploadById(uploadId: string, userId: string) {
        const record = await this.userUploadRepo.findUploadById(uploadId, userId);
        if (!record) return null;
        return {
            ...record,
            url: `${this.publicUrlPrefix}/${record.bucketKey}`,
        };
    }

    /**
     * Get a user-scoped upload (throws NotFoundError if not found).
     */
    async getUserUploadById(uploadId: string, userId: string) {
        const upload = await this.findUserUploadById(uploadId, userId);
        return this.assertExists(upload, `User upload ${uploadId} not found`);
    }

    /**
     * Delete a user-scoped upload and its remote physical file.
     */
    async deleteUserUpload(uploadId: string, userId: string): Promise<boolean> {
        const record = await this.userUploadRepo.findUploadById(uploadId, userId);
        if (record) {
            await this.bucketService.delete(record.bucketKey);
            return await this.userUploadRepo.delete(uploadId, userId);
        }
        return false;
    }

    /**
     * Verify that an upload exists, is completed, and is an image.
     */
    async getVerifiedImageUploadUrl(uploadId: string, organizationId: string): Promise<string> {
        const upload = await this.getUploadById(uploadId, organizationId);
        if (upload.status !== "completed") {
            throw new NotFoundError("Image upload not found or not completed");
        }
        if (!upload.contentType.startsWith("image/")) {
            throw new ForbiddenError("Upload must be an image");
        }
        return upload.url;
    }

    /**
     * Safely delete a file from both organization and user buckets based on URL.
     */
    async deleteUploadByUrlGlobalSafely(url: string): Promise<void> {
        const key = url.replace(`${this.publicUrlPrefix}/`, "");
        await this.bucketService.delete(key);
        await this.uploadRepo.deleteByBucketKey(key);
        await this.userUploadRepo.deleteByBucketKey(key);
    }
}
