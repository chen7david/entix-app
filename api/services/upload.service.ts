import { BucketService } from "./bucket.service";
import { UploadRepository } from "@api/repositories/upload.repository";
import { nanoid } from "nanoid";

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
        // bucket key format: {organizationId}/{uploadId}-{safeName}
        const uploadId = nanoid();
        const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const bucketKey = `${organizationId}/${uploadId}-${safeName}`;

        // expiresIn defaults to 3600 internally
        const presignedUrl = await this.bucketService.getPresignedUploadUrl(bucketKey);

        const uploadRecord = await this.uploadRepo.create({
            id: uploadId,
            originalName,
            bucketKey,
            url: `${this.publicUrlPrefix}/${bucketKey}`,
            fileSize,
            contentType,
            organizationId,
            uploadedBy: userId,
            status: "pending"
        });

        return {
            uploadId: uploadRecord.id,
            presignedUrl,
            url: uploadRecord.url,
            bucketKey: uploadRecord.bucketKey
        };
    }

    async completeUpload(uploadId: string, organizationId: string) {
        const record = await this.uploadRepo.updateStatus(uploadId, organizationId, "completed");
        if (!record) {
            throw new Error("Upload not found");
        }
        return record;
    }

    async deleteUpload(uploadId: string, organizationId: string) {
        const record = await this.uploadRepo.findById(uploadId, organizationId);
        if (!record) return false;

        // delete from R2
        await this.bucketService.delete(record.bucketKey);

        // delete from DB
        return await this.uploadRepo.delete(uploadId, organizationId);
    }

    async listUploads(organizationId: string) {
        return this.uploadRepo.findAllByOrganization(organizationId);
    }
}
