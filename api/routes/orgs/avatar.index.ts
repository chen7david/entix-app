import { createRouter } from "@api/lib/app.lib";
import { AvatarHandler } from "./avatar.handlers";
import { AvatarRoutes } from "./avatar.routes";

export const avatarRoutes = createRouter()
    .openapi(AvatarRoutes.updateAvatar, AvatarHandler.updateAvatar)
    .openapi(AvatarRoutes.removeAvatar, AvatarHandler.removeAvatar);
