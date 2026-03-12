import { UserRepository } from "@api/repositories/user.repository";
import { MemberRepository } from "@api/repositories/member.repository";
import { UploadService } from "@api/services/upload.service";
import { ForbiddenError, NotFoundError } from "@api/errors/app.error";

export class AvatarService {
    constructor(
        private userRepo: UserRepository,
        private memberRepo: MemberRepository,
        private uploadService: UploadService
    ) { }

    async updateAvatar(organizationId: string, targetUserId: string, uploadId: string) {
        // Verify the target user is a member of this organization
        const membership = await this.memberRepo.findMembership(targetUserId, organizationId);
        if (!membership) {
            throw new NotFoundError("Member not found in this organization");
        }

        // Find the completed upload
        const upload = await this.uploadService.getUploadById(uploadId, organizationId);
        if (!upload || upload.status !== "completed") {
            throw new NotFoundError("Upload not found or not yet completed");
        }

        // Enforce that only images can be set as avatars
        if (!upload.contentType.startsWith("image/")) {
            throw new ForbiddenError("Only image files can be used as profile pictures");
        }

        // If user already has an avatar, attempt to delete the old file & db record
        const userRecord = await this.userRepo.findUserById(targetUserId);
        if (userRecord?.image) {
            const oldUpload = await this.uploadService.getUploadByUrl(userRecord.image, organizationId);
            if (oldUpload) {
                try {
                    // This deletes BOTH from R2 and the database
                    await this.uploadService.deleteUpload(oldUpload.id, organizationId);
                } catch (err: unknown) {
                    // Log handled upstream or by wrapper if needed, 
                    // or we could pass a logger if we wanted to keeps it strictly DI.
                    // For now keeping business logic clean.
                }
            }
        }

        // Update user.image to the new upload URL
        await this.userRepo.updateUser(targetUserId, { image: upload.url });

        return { imageUrl: upload.url };
    }

    async removeAvatar(organizationId: string, targetUserId: string) {
        // Verify target is a member
        const membership = await this.memberRepo.findMembership(targetUserId, organizationId);
        if (!membership) {
            throw new NotFoundError("Member not found in this organization");
        }

        // Get current avatar URL
        const userRecord = await this.userRepo.findUserById(targetUserId);
        if (!userRecord?.image) {
            throw new NotFoundError("No avatar to remove");
        }

        // Try to find the upload record to delete from R2 & DB
        const avatarUpload = await this.uploadService.getUploadByUrl(userRecord.image, organizationId);

        if (avatarUpload) {
            try {
                await this.uploadService.deleteUpload(avatarUpload.id, organizationId);
            } catch (err: unknown) {
                // Non-blocking
            }
        }

        // Clear user.image
        await this.userRepo.updateUser(targetUserId, { image: null });
    }
}
