import { createRouter } from "@api/lib/app.lib";
import { SocialMediaHandler } from "./social-media.handlers";
import { SocialMediaRoutes } from './social-media.routes';

export const socialMediaRoutes = createRouter()
    .openapi(SocialMediaRoutes.findAll, SocialMediaHandler.findAll);
