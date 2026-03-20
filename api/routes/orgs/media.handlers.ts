import { AppHandler } from "@api/helpers/types.helpers";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { MediaRoutes } from "./media.routes";
import { getMediaService } from "@api/factories/service.factory";

export class MediaHandlers {
    static listMedia: AppHandler<typeof MediaRoutes.listMedia> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const { type } = ctx.req.valid("query");
        const mediaService = getMediaService(ctx);
        const media = await mediaService.listMedia(organizationId, type);
        return ctx.json(media, HttpStatusCodes.OK);
    };

    static createMedia: AppHandler<typeof MediaRoutes.createMedia> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const input = ctx.req.valid("json");
        const userId = ctx.get("userId")!;
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
        
        // Assert updated is not undefined because service throws if not found
        return ctx.json(updated!, HttpStatusCodes.OK);
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

    static addSubtitle: AppHandler<typeof MediaRoutes.addSubtitle> = async (ctx) => {
        const { organizationId, mediaId } = ctx.req.valid("param");
        const payload = ctx.req.valid("json");
        const mediaService = getMediaService(ctx);
        
        const subtitle = await mediaService.addSubtitle(organizationId, mediaId, payload);
        ctx.var.logger.info({ organizationId, mediaId, subtitleId: subtitle.id }, "Subtitle added to media");
        
        return ctx.json(subtitle, HttpStatusCodes.CREATED);
    };

    static deleteSubtitle: AppHandler<typeof MediaRoutes.deleteSubtitle> = async (ctx) => {
        const { organizationId, mediaId, subtitleId } = ctx.req.valid("param");
        const mediaService = getMediaService(ctx);
        
        await mediaService.deleteSubtitle(organizationId, mediaId, subtitleId);
        ctx.var.logger.info({ organizationId, mediaId, subtitleId }, "Subtitle deleted from media");
        
        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };

    static updateMetadata: AppHandler<typeof MediaRoutes.updateMetadata> = async (ctx) => {
        const { organizationId, mediaId } = ctx.req.valid("param");
        const metadata = ctx.req.valid("json");
        const mediaService = getMediaService(ctx);
        
        const updated = await mediaService.updateMetadata(organizationId, mediaId, metadata);
        ctx.var.logger.info({ organizationId, mediaId }, "Media metadata updated");
        
        return ctx.json(updated, HttpStatusCodes.OK);
    };
}
