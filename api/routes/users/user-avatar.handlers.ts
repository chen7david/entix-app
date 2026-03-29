import { getAvatarService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { UserAvatarRoutes } from "./user-avatar.routes";

export class UserAvatarHandlers {
    /**
     * POST /users/:userId/avatar/presigned-url
     */
    static requestAvatarUploadUrl: AppHandler<typeof UserAvatarRoutes.requestAvatarUploadUrl> =
        async (ctx) => {
            const { userId: targetUserId } = ctx.req.valid("param");
            const { originalName, contentType, fileSize } = ctx.req.valid("json");

            const avatarService = getAvatarService(ctx);
            const result = await avatarService.requestAvatarUploadUrl(
                targetUserId,
                originalName,
                contentType,
                fileSize
            );

            ctx.var.logger.info({ targetUserId }, "Avatar upload URL generated");

            return ctx.json(result, HttpStatusCodes.CREATED);
        };

    /**
     * PATCH /users/:userId/avatar
     */
    static updateAvatar: AppHandler<typeof UserAvatarRoutes.updateAvatar> = async (ctx) => {
        const { userId: targetUserId } = ctx.req.valid("param");
        const { uploadId } = ctx.req.valid("json");
        const callerId = ctx.get("userId");

        const avatarService = getAvatarService(ctx);
        const result = await avatarService.updateAvatar(targetUserId, uploadId, callerId);

        ctx.var.logger.info({ targetUserId, uploadId, callerId }, "Avatar updated");

        return ctx.json(result, HttpStatusCodes.OK);
    };

    /**
     * DELETE /users/:userId/avatar
     */
    static removeAvatar: AppHandler<typeof UserAvatarRoutes.removeAvatar> = async (ctx) => {
        const { userId: targetUserId } = ctx.req.valid("param");

        const avatarService = getAvatarService(ctx);
        await avatarService.removeAvatar(targetUserId);

        ctx.var.logger.info({ targetUserId }, "Avatar removed");

        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };
}
