import { UserRepository } from "@api/repositories/user.repository";
import { UploadService } from "./upload.service";
import { NotFoundError } from "@api/errors/app.error";
import { USER_ASSETS_PREFIX, AVATAR_BUCKET_FOLDER } from "@api/helpers/constants.helpers";

export class AvatarService {
    constructor(
        private userRepo: UserRepository,
        private uploadService: UploadService
    ) { }

    async requestAvatarUploadUrl(
        targetUserId: string,
        originalName: string,
        contentType: string,
        fileSize: number
    ) {
        // storage is always user-centric now
        return await this.uploadService.createUserUploadPresignedUrl(
            `${USER_ASSETS_PREFIX}/${targetUserId}/${AVATAR_BUCKET_FOLDER}`,
            targetUserId,
            originalName,
            contentType,
            fileSize
        );
    }

    async updateAvatar(targetUserId: string, uploadId: string, _callerId: string) {
        const user = await this.userRepo.findUserById(targetUserId);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        // 1. Get the new upload from user_uploads
        const newUpload = await this.uploadService.getUserUploadById(uploadId, targetUserId);
        if (!newUpload) {
            throw new NotFoundError("Upload not found");
        }

        if (newUpload.status !== "completed") {
            throw new Error("Upload must be completed before updating avatar");
        }

        // 2. Update user record
        await this.userRepo.updateUser(targetUserId, {
            image: newUpload.url
        });

        return {
            success: true,
            imageUrl: newUpload.url
        };
    }

    async removeAvatar(targetUserId: string) {
        const user = await this.userRepo.findUserById(targetUserId);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        if (!user.image) {
            throw new NotFoundError("No avatar to remove");
        }

        // Update user record to clear image
        await this.userRepo.updateUser(targetUserId, {
            image: null
        });

        return { success: true };
    }
}
