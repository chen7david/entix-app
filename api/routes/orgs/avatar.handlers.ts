import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from "@api/helpers/types.helpers";
import { AvatarRoutes } from "./avatar.routes";
import { getUploadService } from "@api/factories/upload.factory";
import { UserRepository } from "@api/repositories/user.repository";
import { MemberRepository } from "@api/repositories/member.repository";
import { getBucketClient } from "@api/factories/bucket.factory";
import { ForbiddenError, NotFoundError } from "@api/errors/app.error";

/**
 * Checks if the requesting user is allowed to modify the target user's avatar.
 * A user can update their own avatar, or an admin/owner can update any member's.
 */
function canModifyAvatar(currentUserId: string, targetUserId: string, membershipRole?: string): boolean {
    if (currentUserId === targetUserId) return true;

    const roles = (membershipRole || "").split(",").map(r => r.trim());
    return roles.some(r => r === "admin" || r === "owner");
}

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
        const currentUserId = ctx.var.userId!;

        // Authorization: self-update or admin/owner
        if (!canModifyAvatar(currentUserId, targetUserId, ctx.var.membershipRole)) {
            throw new ForbiddenError("You do not have permission to update this member's avatar");
        }

        // Verify the target user is a member of this organization
        const memberRepo = new MemberRepository(ctx);
        const membership = await memberRepo.findMembership(targetUserId, organizationId);
        if (!membership) {
            throw new NotFoundError("Member not found in this organization");
        }

        // Find the completed upload
        const uploadService = getUploadService(ctx);
        const uploads = await uploadService.listUploads(organizationId);
        const upload = uploads.find(u => u.id === uploadId && u.status === "completed");
        if (!upload) {
            throw new NotFoundError("Upload not found or not yet completed");
        }

        // If user already has an avatar, attempt to delete the old file from R2
        const userRepo = new UserRepository(ctx);
        const userRecord = await userRepo.findUserById(targetUserId);
        if (userRecord?.image) {
            const oldUpload = uploads.find(u => u.url === userRecord.image);
            if (oldUpload) {
                try {
                    const bucketService = getBucketClient(ctx);
                    await bucketService.delete(oldUpload.bucketKey);
                    ctx.var.logger.info({ oldBucketKey: oldUpload.bucketKey }, "Deleted old avatar from R2");
                } catch (err) {
                    // Non-blocking: log and continue
                    ctx.var.logger.warn({ error: err }, "Failed to delete old avatar from R2");
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
        const currentUserId = ctx.var.userId!;

        // Authorization: self-update or admin/owner
        if (!canModifyAvatar(currentUserId, targetUserId, ctx.var.membershipRole)) {
            throw new ForbiddenError("You do not have permission to remove this member's avatar");
        }

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

        // Try to find the upload record to delete from R2
        const uploadService = getUploadService(ctx);
        const uploads = await uploadService.listUploads(organizationId);
        const avatarUpload = uploads.find(u => u.url === userRecord.image);

        if (avatarUpload) {
            try {
                const bucketService = getBucketClient(ctx);
                const deleted = await bucketService.delete(avatarUpload.bucketKey);
                if (!deleted) {
                    ctx.var.logger.warn({ bucketKey: avatarUpload.bucketKey }, "R2 delete returned false for avatar");
                }
            } catch (err) {
                // Non-blocking: proceed to clear the DB even if R2 fails
                ctx.var.logger.warn({ error: err }, "Failed to delete avatar from R2");
            }
        }

        // Clear user.image
        await userRepo.updateUser(targetUserId, { image: null });

        ctx.var.logger.info({ targetUserId, organizationId }, "Avatar removed");

        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };
}
