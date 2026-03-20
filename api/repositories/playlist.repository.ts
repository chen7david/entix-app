import { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema.db";
import { eq, and, desc } from "drizzle-orm";

export type CreatePlaylistInput = {
    id: string;
    organizationId: string;
    title: string;
    description?: string;
    coverArtUrl?: string;
    createdBy: string;
};

export class PlaylistRepository {
    constructor(private db: AppDb) { }

    async create(input: CreatePlaylistInput): Promise<schema.Playlist> {
        const [playlist] = await this.db.insert(schema.playlist).values(input).returning();
        return playlist;
    }

    async findById(id: string, organizationId: string): Promise<schema.Playlist | undefined> {
        return await this.db.query.playlist.findFirst({
            where: and(
                eq(schema.playlist.id, id),
                eq(schema.playlist.organizationId, organizationId)
            ),
        });
    }

    async findAllByOrganization(organizationId: string): Promise<schema.Playlist[]> {
        return await this.db.select()
            .from(schema.playlist)
            .where(eq(schema.playlist.organizationId, organizationId))
            .orderBy(desc(schema.playlist.createdAt));
    }

    async update(
        id: string,
        organizationId: string,
        updates: Partial<Pick<schema.Playlist, "title" | "description" | "coverArtUrl">>
    ): Promise<schema.Playlist | undefined> {
        const [updated] = await this.db.update(schema.playlist)
            .set({ ...updates, updatedAt: new Date() })
            .where(and(eq(schema.playlist.id, id), eq(schema.playlist.organizationId, organizationId)))
            .returning();
        return updated;
    }

    async delete(id: string, organizationId: string): Promise<boolean> {
        const result = await this.db.delete(schema.playlist)
            .where(and(eq(schema.playlist.id, id), eq(schema.playlist.organizationId, organizationId)))
            .returning();
        return result.length > 0;
    }

    // Playlist Media Association Logic
    async setMediaSequence(playlistId: string, mediaIds: string[]): Promise<void> {
        const deleteStmt = this.db.delete(schema.playlistMedia).where(eq(schema.playlistMedia.playlistId, playlistId));
        
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

    async getMediaSequence(playlistId: string): Promise<schema.PlaylistMedia[]> {
        return await this.db.select()
            .from(schema.playlistMedia)
            .where(eq(schema.playlistMedia.playlistId, playlistId))
            .orderBy(schema.playlistMedia.position);
    }
}
