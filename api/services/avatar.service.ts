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

    async updateAvatar(organizationId: string, targetUserId: string, uploadId: string, callerId: string) {
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
            const oldUpload = await this.uploadService.getUploadByUrlGlobal(userRecord.image);
            
            if (oldUpload) {
                const isUploader = oldUpload.uploadedBy === callerId;
                const isSameOrg = oldUpload.organizationId === organizationId;

                if (isUploader || isSameOrg) {
                    try {
                        // This deletes BOTH from R2 and the database organically across any organization boundaries!
                        await this.uploadService.deleteUploadGlobal(oldUpload.id);
                    } catch (err: unknown) {
                        // Log handled upstream or by wrapper if needed, 
                        // or we could pass a logger if we wanted to keeps it strictly DI.
                        // For now keeping business logic clean.
                    }
                }
            }
        }

        // Update user.image to the new upload URL
        await this.userRepo.updateUser(targetUserId, { image: upload.url });

        return { imageUrl: upload.url };
    }

    async removeAvatar(organizationId: string, targetUserId: string, callerId: string) {
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

        // Try to find the upload record to delete from R2 & DB across any organization boundary
        const avatarUpload = await this.uploadService.getUploadByUrlGlobal(userRecord.image);

        if (avatarUpload) {
            const isUploader = avatarUpload.uploadedBy === callerId;
            const isSameOrg = avatarUpload.organizationId === organizationId;

            if (isUploader || isSameOrg) {
                try {
                    await this.uploadService.deleteUploadGlobal(avatarUpload.id);
                } catch (err: unknown) {
                    // Non-blocking
                }
            }
        }

        // Clear user.image
        await this.userRepo.updateUser(targetUserId, { image: null });
    }
}
