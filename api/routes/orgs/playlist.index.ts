import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "@api/helpers/types.helpers";
import { PlaylistRoutes } from "./playlist.routes";
import { PlaylistHandlers } from "./playlist.handlers";

export const playlistRoutes = new OpenAPIHono<AppEnv>()
    .openapi(PlaylistRoutes.listPlaylists, PlaylistHandlers.listPlaylists)
    .openapi(PlaylistRoutes.createPlaylist, PlaylistHandlers.createPlaylist)
    .openapi(PlaylistRoutes.updatePlaylist, PlaylistHandlers.updatePlaylist)
    .openapi(PlaylistRoutes.deletePlaylist, PlaylistHandlers.deletePlaylist)
    .openapi(PlaylistRoutes.getSequence, PlaylistHandlers.getSequence)
    .openapi(PlaylistRoutes.updateSequence, PlaylistHandlers.updateSequence);
