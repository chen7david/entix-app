import type { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema";
import { and, desc, eq } from "drizzle-orm";

export type CreatePlaylistInput = {
    id: string;
    organizationId: string;
    title: string;
    description?: string;
    coverArtUrl?: string;
    createdBy: string;
};

export class PlaylistRepository {
    constructor(private db: AppDb) {}

    async create(input: CreatePlaylistInput): Promise<schema.Playlist> {
        const [playlist] = await this.db.insert(schema.playlists).values(input).returning();
        return playlist;
    }

    async findPlaylistById(id: string, organizationId: string): Promise<schema.Playlist | null> {
        const playlist = await this.db.query.playlists.findFirst({
            where: and(
                eq(schema.playlists.id, id),
                eq(schema.playlists.organizationId, organizationId)
            ),
        });
        return playlist ?? null;
    }

    async findPlaylistsByOrganization(organizationId: string): Promise<schema.Playlist[]> {
        return await this.db
            .select()
            .from(schema.playlists)
            .where(eq(schema.playlists.organizationId, organizationId))
            .orderBy(desc(schema.playlists.createdAt));
    }

    async update(
        id: string,
        organizationId: string,
        updates: Partial<Pick<schema.Playlist, "title" | "description" | "coverArtUrl">>
    ): Promise<schema.Playlist | null> {
        const [updated] = await this.db
            .update(schema.playlists)
            .set({ ...updates, updatedAt: new Date() })
            .where(
                and(
                    eq(schema.playlists.id, id),
                    eq(schema.playlists.organizationId, organizationId)
                )
            )
            .returning();
        return updated ?? null;
    }

    async delete(id: string, organizationId: string): Promise<boolean> {
        const result = await this.db
            .delete(schema.playlists)
            .where(
                and(
                    eq(schema.playlists.id, id),
                    eq(schema.playlists.organizationId, organizationId)
                )
            )
            .returning();
        return result.length > 0;
    }

    async setMediaSequence(playlistId: string, mediaIds: string[]): Promise<void> {
        const deleteStmt = this.db
            .delete(schema.playlistMedia)
            .where(eq(schema.playlistMedia.playlistId, playlistId));

        if (mediaIds.length > 0) {
            const mappings = mediaIds.map((mediaId, index) => ({
                playlistId,
                mediaId,
                position: index,
            }));
            const insertStmt = this.db.insert(schema.playlistMedia).values(mappings);
            await this.db.batch([deleteStmt, insertStmt]);
        } else {
            await deleteStmt;
        }
    }

    async findMediaSequence(playlistId: string): Promise<schema.PlaylistMedia[]> {
        return await this.db
            .select()
            .from(schema.playlistMedia)
            .where(eq(schema.playlistMedia.playlistId, playlistId))
            .orderBy(schema.playlistMedia.position);
    }
}
