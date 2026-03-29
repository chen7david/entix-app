import { getSocialMediaService, getUserProfileService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { UserProfileRoutes } from "./user-profiles.routes";

export class UserProfileHandler {
    static getAggregate: AppHandler<typeof UserProfileRoutes.getAggregate> = async (ctx) => {
        const { userId } = ctx.req.valid("param");
        const service = getUserProfileService(ctx);
        const socialService = getSocialMediaService(ctx);
        const data = await service.getProfileAggregate(userId);
        const socialMedias = await socialService.getUserSocialMedias(userId);
        return ctx.json({ ...data, socialMedias }, HttpStatusCodes.OK);
    };

    static upsertProfile: AppHandler<typeof UserProfileRoutes.upsertProfile> = async (ctx) => {
        const { userId } = ctx.req.valid("param");
        const body = ctx.req.valid("json");
        const service = getUserProfileService(ctx);
        await service.upsertProfile(userId, body);
        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };

    static addPhone: AppHandler<typeof UserProfileRoutes.addPhone> = async (ctx) => {
        const { userId } = ctx.req.valid("param");
        const body = ctx.req.valid("json");
        const service = getUserProfileService(ctx);
        await service.addPhoneNumber(userId, body);
        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };

    static updatePhone: AppHandler<typeof UserProfileRoutes.updatePhone> = async (ctx) => {
        const { userId, id } = ctx.req.valid("param");
        const body = ctx.req.valid("json");
        const service = getUserProfileService(ctx);
        await service.updatePhoneNumber(id, userId, body);
        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };

    static deletePhone: AppHandler<typeof UserProfileRoutes.deletePhone> = async (ctx) => {
        const { userId, id } = ctx.req.valid("param");
        const service = getUserProfileService(ctx);
        await service.deletePhoneNumber(id, userId);
        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };

    static addAddress: AppHandler<typeof UserProfileRoutes.addAddress> = async (ctx) => {
        const { userId } = ctx.req.valid("param");
        const body = ctx.req.valid("json");
        const service = getUserProfileService(ctx);
        await service.addAddress(userId, body);
        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };

    static updateAddress: AppHandler<typeof UserProfileRoutes.updateAddress> = async (ctx) => {
        const { userId, id } = ctx.req.valid("param");
        const body = ctx.req.valid("json");
        const service = getUserProfileService(ctx);
        await service.updateAddress(id, userId, body);
        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };

    static deleteAddress: AppHandler<typeof UserProfileRoutes.deleteAddress> = async (ctx) => {
        const { userId, id } = ctx.req.valid("param");
        const service = getUserProfileService(ctx);
        await service.deleteAddress(id, userId);
        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };

    static addSocial: AppHandler<typeof UserProfileRoutes.addSocial> = async (ctx) => {
        const { userId } = ctx.req.valid("param");
        const body = ctx.req.valid("json");
        const service = getSocialMediaService(ctx);
        await service.linkSocialMedia(userId, body.socialMediaTypeId, body.urlOrHandle);
        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };

    static updateSocial: AppHandler<typeof UserProfileRoutes.updateSocial> = async (ctx) => {
        const { userId, id } = ctx.req.valid("param");
        const body = ctx.req.valid("json");
        const service = getSocialMediaService(ctx);
        await service.updateLinkedSocialMedia(id, userId, body.socialMediaTypeId, body.urlOrHandle);
        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };

    static deleteSocial: AppHandler<typeof UserProfileRoutes.deleteSocial> = async (ctx) => {
        const { userId, id } = ctx.req.valid("param");
        const service = getSocialMediaService(ctx);
        await service.unlinkSocialMedia(id, userId);
        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };
}
