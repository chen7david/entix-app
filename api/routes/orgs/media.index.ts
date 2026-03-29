import { createRouter } from "@api/lib/app.lib";
import { MediaHandlers } from "./media.handlers";
import { MediaRoutes } from "./media.routes";

export const mediaRoutes = createRouter()
    .openapi(MediaRoutes.listMedia, MediaHandlers.listMedia)
    .openapi(MediaRoutes.createMedia, MediaHandlers.createMedia)
    .openapi(MediaRoutes.updateMedia, MediaHandlers.updateMedia)
    .openapi(MediaRoutes.deleteMedia, MediaHandlers.deleteMedia)
    .openapi(MediaRoutes.recordPlay, MediaHandlers.recordPlay);
