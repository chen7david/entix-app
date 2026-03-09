import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from "@api/helpers/types.helpers";
import { AvatarRoutes } from "./avatar.routes";
import { getUploadService } from "@api/factories/upload.factory";
import { UserRepository } from "@api/repositories/user.repository";
import { MemberRepository } from "@api/repositories/member.repository";
import { getBucketClient } from "@api/factories/bucket.factory";
import { ForbiddenError, NotFoundError } from "@api/errors/app.error";



export class AvatarHandler {
    /**
     * PATCH /orgs/:organizationId/members/:userId/avatar
     *
     * Links a completed upload to the user's profile image.
     * If the user already has an avatar stored in R2, the old file is cleaned up.
     */
    static updateAvatar: AppHandler<typeof AvatarRoutes.updateAvatar> = async (ctx) => {
        const { organizationId, userId: targetUserId } = ctx.req.valid("param");
        const { uploadId } = ctx.req.valid("json");

        // Verify the target user is a member of this organization
        const memberRepo = new MemberRepository(ctx);
        const membership = await memberRepo.findMembership(targetUserId, organizationId);
        if (!membership) {
            throw new NotFoundError("Member not found in this organization");
        }

        // Find the completed upload
        const uploadService = getUploadService(ctx);
        const upload = await uploadService.getUploadById(uploadId, organizationId);
        if (!upload || upload.status !== "completed") {
            throw new NotFoundError("Upload not found or not yet completed");
        }

        // Enforce that only images can be set as avatars
        if (!upload.contentType.startsWith("image/")) {
            throw new ForbiddenError("Only image files can be used as profile pictures");
        }

        // If user already has an avatar, attempt to delete the old file & db record
        const userRepo = new UserRepository(ctx);
        const userRecord = await userRepo.findUserById(targetUserId);
        if (userRecord?.image) {
            const oldUpload = await uploadService.getUploadByUrl(userRecord.image, organizationId);
            if (oldUpload) {
                try {
                    // This deletes BOTH from R2 and the database
                    await uploadService.deleteUpload(oldUpload.id, organizationId);
                    ctx.var.logger.info({ oldUploadId: oldUpload.id }, "Deleted old avatar upload");
                } catch (err) {
                    // Non-blocking: log and continue
                    ctx.var.logger.warn({ error: err }, "Failed to delete old avatar upload");
                }
            }
        }

        // Update user.image to the new upload URL
        await userRepo.updateUser(targetUserId, { image: upload.url });

        ctx.var.logger.info({ targetUserId, uploadId, organizationId }, "Avatar updated");

        return ctx.json({ imageUrl: upload.url }, HttpStatusCodes.OK);
    };

    /**
     * DELETE /orgs/:organizationId/members/:userId/avatar
     *
     * Removes the user's avatar: deletes from R2 and sets user.image to null.
     */
    static removeAvatar: AppHandler<typeof AvatarRoutes.removeAvatar> = async (ctx) => {
        const { organizationId, userId: targetUserId } = ctx.req.valid("param");

        // Verify target is a member
        const memberRepo = new MemberRepository(ctx);
        const membership = await memberRepo.findMembership(targetUserId, organizationId);
        if (!membership) {
            throw new NotFoundError("Member not found in this organization");
        }

        // Get current avatar URL
        const userRepo = new UserRepository(ctx);
        const userRecord = await userRepo.findUserById(targetUserId);
        if (!userRecord?.image) {
            throw new NotFoundError("No avatar to remove");
        }

        // Try to find the upload record to delete from R2 & DB
        const uploadService = getUploadService(ctx);
        const avatarUpload = await uploadService.getUploadByUrl(userRecord.image, organizationId);

        if (avatarUpload) {
            try {
                await uploadService.deleteUpload(avatarUpload.id, organizationId);
            } catch (err) {
                // Non-blocking: proceed to clear the DB even if deletion fails
                ctx.var.logger.warn({ error: err }, "Failed to delete avatar upload record");
            }
        }

        // Clear user.image
        await userRepo.updateUser(targetUserId, { image: null });

        ctx.var.logger.info({ targetUserId, organizationId }, "Avatar removed");

        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };
}
