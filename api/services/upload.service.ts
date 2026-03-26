import { BucketService } from "./bucket.service";
import { UploadRepository, UserUploadRepository } from "@api/repositories/upload.repository";
import { NotFoundError, ForbiddenError } from "@api/errors/app.error";

export class UploadService {
    constructor(
        private bucketService: BucketService,
        private uploadRepo: UploadRepository,
        private userUploadRepo: UserUploadRepository,
        private publicUrlPrefix: string
    ) { }

    // --- Organization Assets (Implicit) ---

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
        const ext = extMatch ? extMatch[0].toLowerCase() : '';
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
            status: "pending"
        });

        return {
            uploadId: uploadRecord.id,
            presignedUrl,
            url: `${this.publicUrlPrefix}/${bucketKey}`,
            bucketKey: uploadRecord.bucketKey
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

    async getUploadById(uploadId: string, organizationId: string) {
        const record = await this.uploadRepo.findById(uploadId, organizationId);
        if (!record) return undefined;
        return {
            ...record,
            url: `${this.publicUrlPrefix}/${record.bucketKey}`
        };
    }

    async listUploads(organizationId: string) {
        const uploads = await this.uploadRepo.findAllByOrganization(organizationId);
        return uploads.map(u => ({
            ...u,
            url: `${this.publicUrlPrefix}/${u.bucketKey}`
        }));
    }

    async deleteUpload(uploadId: string, organizationId: string): Promise<boolean> {
        const record = await this.uploadRepo.findById(uploadId, organizationId);
        if (record) {
            await this.bucketService.delete(record.bucketKey);
            return await this.uploadRepo.delete(uploadId, organizationId);
        }
        return false;
    }

    // --- User Assets (Global) ---

    async createUserUploadPresignedUrl(
        storagePrefix: string,
        userId: string,
        originalName: string,
        contentType: string,
        fileSize: number
    ) {
        const uploadId = crypto.randomUUID();
        const extMatch = originalName.match(/\.[0-9a-z]+$/i);
        const ext = extMatch ? extMatch[0].toLowerCase() : '';
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
            status: "pending"
        });

        return {
            uploadId: uploadRecord.id,
            presignedUrl,
            url: `${this.publicUrlPrefix}/${bucketKey}`,
            bucketKey: uploadRecord.bucketKey
        };
    }

    async completeUserUpload(uploadId: string, userId: string) {
        const record = await this.userUploadRepo.updateStatus(uploadId, userId, "completed");
        if (!record) {
            throw new NotFoundError("User upload not found");
        }
        return {
            ...record,
            url: `${this.publicUrlPrefix}/${record.bucketKey}`
        };
    }

    async getUserUploadById(uploadId: string, userId: string) {
        const record = await this.userUploadRepo.findById(uploadId, userId);
        if (!record) return undefined;
        return {
            ...record,
            url: `${this.publicUrlPrefix}/${record.bucketKey}`
        };
    }

    async deleteUserUpload(uploadId: string, userId: string): Promise<boolean> {
        const record = await this.userUploadRepo.findById(uploadId, userId);
        if (record) {
            await this.bucketService.delete(record.bucketKey);
            return await this.userUploadRepo.delete(uploadId, userId);
        }
        return false;
    }

    // --- Helper / Validation Methods ---

    async getVerifiedImageUploadUrl(uploadId: string, organizationId: string): Promise<string> {
        const upload = await this.getUploadById(uploadId, organizationId);
        if (!upload || upload.status !== "completed") {
            throw new NotFoundError("Image upload not found or not completed");
        }
        if (!upload.contentType.startsWith("image/")) {
            throw new ForbiddenError("Upload must be an image");
        }
        return upload.url;
    }

    async deleteUploadByUrlGlobalSafely(url: string): Promise<void> {
        const key = url.replace(`${this.publicUrlPrefix}/`, "");
        await this.bucketService.delete(key);
        // We delete from both repos just in case it belongs to either
        await this.uploadRepo.deleteByBucketKey(key);
        await this.userUploadRepo.deleteByBucketKey(key);
    }
}
