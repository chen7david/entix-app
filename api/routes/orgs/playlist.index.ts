import type { AppEnv } from "@api/helpers/types.helpers";
import { OpenAPIHono } from "@hono/zod-openapi";
import { PlaylistHandlers } from "./playlist.handlers";
import { PlaylistRoutes } from "./playlist.routes";

export const playlistRoutes = new OpenAPIHono<AppEnv>()
    .openapi(PlaylistRoutes.listPlaylists, PlaylistHandlers.listPlaylists)
    .openapi(PlaylistRoutes.createPlaylist, PlaylistHandlers.createPlaylist)
    .openapi(PlaylistRoutes.getPlaylist, PlaylistHandlers.getPlaylist)
    .openapi(PlaylistRoutes.updatePlaylist, PlaylistHandlers.updatePlaylist)
    .openapi(PlaylistRoutes.deletePlaylist, PlaylistHandlers.deletePlaylist)
    .openapi(PlaylistRoutes.getSequence, PlaylistHandlers.getSequence)
    .openapi(PlaylistRoutes.updateSequence, PlaylistHandlers.updateSequence);
