import { getPlaylistService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { PlaylistRoutes } from "./playlist.routes";

export class PlaylistHandlers {
    static listPlaylists: AppHandler<typeof PlaylistRoutes.listPlaylists> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const playlistService = getPlaylistService(ctx);
        const playlists = await playlistService.listPlaylists(organizationId);
        return ctx.json(playlists, HttpStatusCodes.OK);
    };

    static createPlaylist: AppHandler<typeof PlaylistRoutes.createPlaylist> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const input = ctx.req.valid("json");
        const userId = ctx.get("userId");
        const playlistService = getPlaylistService(ctx);

        const playlist = await playlistService.createPlaylist(organizationId, userId, input);
        ctx.var.logger.info({ organizationId, playlistId: playlist.id }, "Playlist created");

        return ctx.json(playlist, HttpStatusCodes.CREATED);
    };

    static updatePlaylist: AppHandler<typeof PlaylistRoutes.updatePlaylist> = async (ctx) => {
        const { organizationId, playlistId } = ctx.req.valid("param");
        const updates = ctx.req.valid("json");
        const playlistService = getPlaylistService(ctx);

        const updated = await playlistService.updatePlaylist(organizationId, playlistId, updates);
        ctx.var.logger.info({ organizationId, playlistId }, "Playlist updated");

        return ctx.json(updated, HttpStatusCodes.OK);
    };

    static deletePlaylist: AppHandler<typeof PlaylistRoutes.deletePlaylist> = async (ctx) => {
        const { organizationId, playlistId } = ctx.req.valid("param");
        const playlistService = getPlaylistService(ctx);

        await playlistService.deletePlaylist(playlistId, organizationId);
        ctx.var.logger.info({ organizationId, playlistId }, "Playlist deleted");

        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };

    static getSequence: AppHandler<typeof PlaylistRoutes.getSequence> = async (ctx) => {
        const { organizationId, playlistId } = ctx.req.valid("param");
        const playlistService = getPlaylistService(ctx);

        const sequence = await playlistService.getPlaylistSequence(playlistId, organizationId);
        return ctx.json(sequence, HttpStatusCodes.OK);
    };

    static updateSequence: AppHandler<typeof PlaylistRoutes.updateSequence> = async (ctx) => {
        const { organizationId, playlistId } = ctx.req.valid("param");
        const { mediaIds } = ctx.req.valid("json");
        const playlistService = getPlaylistService(ctx);

        await playlistService.setPlaylistSequence(playlistId, organizationId, mediaIds);
        ctx.var.logger.info({ organizationId, playlistId }, "Playlist sequence updated");

        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };
}
