import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from "@api/helpers/types.helpers";
import { AvatarRoutes } from "./avatar.routes";
import { getAvatarService } from "@api/factories/service.factory";


export class AvatarHandler {
    /**
     * PATCH /orgs/:organizationId/members/:userId/avatar
     *
     * Links a completed upload to the user's profile image.
     * Logic delegated to AvatarService.
     */
    static updateAvatar: AppHandler<typeof AvatarRoutes.updateAvatar> = async (ctx) => {
        const { organizationId, userId: targetUserId } = ctx.req.valid("param");
        const { uploadId } = ctx.req.valid("json");

        const avatarService = getAvatarService(ctx);
        const result = await avatarService.updateAvatar(organizationId, targetUserId, uploadId);

        ctx.var.logger.info({ targetUserId, uploadId, organizationId }, "Avatar updated");

        return ctx.json(result, HttpStatusCodes.OK);
    };

    /**
     * DELETE /orgs/:organizationId/members/:userId/avatar
     *
     * Removes the user's avatar.
     * Logic delegated to AvatarService.
     */
    static removeAvatar: AppHandler<typeof AvatarRoutes.removeAvatar> = async (ctx) => {
        const { organizationId, userId: targetUserId } = ctx.req.valid("param");

        const avatarService = getAvatarService(ctx);
        await avatarService.removeAvatar(organizationId, targetUserId);

        ctx.var.logger.info({ targetUserId, organizationId }, "Avatar removed");

        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };
}
