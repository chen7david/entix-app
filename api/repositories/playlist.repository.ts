import type { AppDb } from "@api/factories/db.factory";
import { wrapWildcard } from "@api/helpers/db.helpers";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";
import * as schema from "@shared/db/schema";
import { and, desc, eq, like, type SQL } from "drizzle-orm";

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

    async findPlaylistsPaginated(
        organizationId: string,
        filters: {
            limit?: number;
            cursor?: string;
            direction?: "next" | "prev";
            search?: string;
        }
    ) {
        const { limit = 20, cursor, direction = "next", search } = filters;
        const { where: cursorWhere, orderBy } = buildCursorPagination(
            schema.playlists.createdAt,
            schema.playlists.id,
            cursor,
            direction
        );

        const conditions: (SQL | undefined)[] = [
            eq(schema.playlists.organizationId, organizationId),
        ];

        if (search) {
            conditions.push(like(schema.playlists.title, wrapWildcard(search)));
        }

        if (cursorWhere) {
            conditions.push(cursorWhere);
        }

        const finalFilters = conditions.filter((c): c is SQL => c !== undefined);

        const items = await this.db
            .select()
            .from(schema.playlists)
            .where(and(...finalFilters))
            .orderBy(...orderBy)
            .limit(limit + 1);

        const result = processPaginatedResult(
            items,
            limit,
            direction,
            (row) => ({
                primary: row.createdAt.getTime(),
                secondary: row.id,
            }),
            cursor
        );

        return result;
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

    async findMediaSequence(playlistId: string) {
        return await this.db
            .select({
                playlistId: schema.playlistMedia.playlistId,
                mediaId: schema.playlistMedia.mediaId,
                position: schema.playlistMedia.position,
                addedAt: schema.playlistMedia.addedAt,
                media: schema.media,
            })
            .from(schema.playlistMedia)
            .innerJoin(schema.media, eq(schema.playlistMedia.mediaId, schema.media.id))
            .where(eq(schema.playlistMedia.playlistId, playlistId))
            .orderBy(schema.playlistMedia.position);
    }
}
