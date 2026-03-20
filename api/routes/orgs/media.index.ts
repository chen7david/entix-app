import { createRouter } from "@api/lib/app.lib";
import { MediaRoutes } from "./media.routes";
import { MediaHandlers } from "./media.handlers";

export const mediaRoutes = createRouter()
    .openapi(MediaRoutes.listMedia, MediaHandlers.listMedia)
    .openapi(MediaRoutes.createMedia, MediaHandlers.createMedia)
    .openapi(MediaRoutes.updateMedia, MediaHandlers.updateMedia)
    .openapi(MediaRoutes.deleteMedia, MediaHandlers.deleteMedia)
    .openapi(MediaRoutes.recordPlay, MediaHandlers.recordPlay);
