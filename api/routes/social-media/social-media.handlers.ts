import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from '@api/helpers/types.helpers';
import { SocialMediaRoutes } from './social-media.routes';
import { getSocialMediaService } from '@api/factories/service.factory';

export class SocialMediaHandler {
    static findAll: AppHandler<typeof SocialMediaRoutes.findAll> = async (ctx) => {
        const service = getSocialMediaService(ctx);
        const types = await service.getGlobalSocialMediaTypes();
        return ctx.json(types, HttpStatusCodes.OK);
    }
}
