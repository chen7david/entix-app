import { getMediaService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { MediaRoutes } from "./media.routes";

export class MediaHandlers {
    static listMedia: AppHandler<typeof MediaRoutes.listMedia> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const { type, limit, cursor, direction, search } = ctx.req.valid("query");
        const mediaService = getMediaService(ctx);
        const paginatedResult = await mediaService.listMedia(
            organizationId,
            limit,
            cursor,
            direction,
            search,
            type
        );
        return ctx.json(paginatedResult, HttpStatusCodes.OK);
    };

    static createMedia: AppHandler<typeof MediaRoutes.createMedia> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const input = ctx.req.valid("json");
        const userId = ctx.get("userId");
        const mediaService = getMediaService(ctx);

        const media = await mediaService.createMedia(organizationId, userId, input);
        ctx.var.logger.info({ organizationId, mediaId: media.id }, "Media created");

        return ctx.json(media, HttpStatusCodes.CREATED);
    };

    static updateMedia: AppHandler<typeof MediaRoutes.updateMedia> = async (ctx) => {
        const { organizationId, mediaId } = ctx.req.valid("param");
        const updates = ctx.req.valid("json");
        const mediaService = getMediaService(ctx);

        const updated = await mediaService.updateMedia(organizationId, mediaId, updates);
        ctx.var.logger.info({ organizationId, mediaId }, "Media updated");

        return ctx.json(updated, HttpStatusCodes.OK);
    };

    static deleteMedia: AppHandler<typeof MediaRoutes.deleteMedia> = async (ctx) => {
        const { organizationId, mediaId } = ctx.req.valid("param");
        const mediaService = getMediaService(ctx);

        await mediaService.deleteMedia(mediaId, organizationId);
        ctx.var.logger.info({ organizationId, mediaId }, "Media deleted");

        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };

    static recordPlay: AppHandler<typeof MediaRoutes.recordPlay> = async (ctx) => {
        const { organizationId, mediaId } = ctx.req.valid("param");
        const mediaService = getMediaService(ctx);

        await mediaService.recordPlay(mediaId, organizationId);
        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };
}
