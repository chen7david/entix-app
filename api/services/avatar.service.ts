import { BadRequestError, ConflictError, NotFoundError } from "@api/errors/app.error";
import { AVATAR_BUCKET_FOLDER, USER_ASSETS_PREFIX } from "@api/helpers/constants.helpers";
import type { UserRepository } from "@api/repositories/user.repository";
import { BaseService } from "./base.service";
import type { UploadService } from "./upload.service";

export class AvatarService extends BaseService {
    constructor(
        private userRepo: UserRepository,
        private uploadService: UploadService
    ) {
        super();
    }

    /**
     * Request a presigned URL for uploading a user avatar.
     */
    async requestAvatarUploadUrl(
        targetUserId: string,
        originalName: string,
        contentType: string,
        fileSize: number
    ) {
        return await this.uploadService.createUserUploadPresignedUrl(
            `${USER_ASSETS_PREFIX}/${targetUserId}/${AVATAR_BUCKET_FOLDER}`,
            targetUserId,
            originalName,
            contentType,
            fileSize
        );
    }

    /**
     * Update a user's avatar using a completed upload.
     */
    async updateAvatar(targetUserId: string, uploadId: string, _callerId: string) {
        const user = await this.userRepo.findUserById(targetUserId);
        this.assertExists(user, `User with ID ${targetUserId} not found`);

        const newUpload = await this.uploadService.getUserUploadById(uploadId, targetUserId);
        // Note: getUserUploadById already uses assertExists within UploadService.

        if (newUpload.status !== "completed") {
            throw new ConflictError("Upload must be completed before updating avatar");
        }

        if (!newUpload.contentType.startsWith("image/")) {
            throw new BadRequestError("Avatar upload must be an image");
        }

        await this.userRepo.updateUser(targetUserId, {
            image: newUpload.url,
        });

        return {
            success: true,
            imageUrl: newUpload.url,
        };
    }

    /**
     * Remove a user's avatar (sets image column to null).
     */
    async removeAvatar(targetUserId: string) {
        const user = await this.userRepo.findUserById(targetUserId);
        this.assertExists(user, `User with ID ${targetUserId} not found`);

        if (!user?.image) {
            throw new NotFoundError("No avatar to remove");
        }

        await this.userRepo.updateUser(targetUserId, {
            image: null,
        });

        return { success: true };
    }
}
