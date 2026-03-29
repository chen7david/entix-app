import type { AppDb } from "@api/factories/db.factory";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";
import * as schema from "@shared/db/schema";
import { and, eq, like, or } from "drizzle-orm";

export type CreateMediaInput = {
    id: string;
    organizationId: string;
    title: string;
    description?: string;
    mimeType: string;
    mediaUrl: string;
    coverArtUrl?: string;
    uploadedBy: string;
};

export class MediaRepository {
    constructor(private db: AppDb) {}

    async create(input: CreateMediaInput): Promise<schema.Media> {
        const [media] = await this.db.insert(schema.media).values(input).returning();
        return media;
    }

    async findById(id: string, organizationId: string): Promise<schema.Media | undefined> {
        return await this.db.query.media.findFirst({
            where: and(eq(schema.media.id, id), eq(schema.media.organizationId, organizationId)),
        });
    }

    async findAllByOrganization(
        organizationId: string,
        limit: number,
        cursor?: string,
        direction: "next" | "prev" = "next",
        search?: string,
        type?: "video" | "audio"
    ) {
        const { where: cursorWhere, orderBy } = buildCursorPagination(
            schema.media.createdAt,
            schema.media.id,
            cursor,
            direction
        );

        const filters = [eq(schema.media.organizationId, organizationId)];
        if (cursorWhere) filters.push(cursorWhere);

        if (type === "video") {
            filters.push(like(schema.media.mimeType, "video/%"));
        } else if (type === "audio") {
            filters.push(like(schema.media.mimeType, "audio/%"));
        }

        if (search) {
            const searchFilter = or(
                like(schema.media.title, `%${search}%`),
                like(schema.media.description, `%${search}%`)
            );
            if (searchFilter) {
                filters.push(searchFilter);
            }
        }

        const items = await this.db
            .select()
            .from(schema.media)
            .where(and(...filters))
            .orderBy(...orderBy)
            .limit(limit + 1);

        return processPaginatedResult(items, limit, direction, (row) => ({
            primary: row.createdAt.getTime(),
            secondary: row.id,
        }));
    }

    async update(
        id: string,
        organizationId: string,
        updates: Partial<Pick<schema.Media, "title" | "description" | "coverArtUrl">>
    ): Promise<schema.Media | undefined> {
        const [updated] = await this.db
            .update(schema.media)
            .set({ ...updates, updatedAt: new Date() })
            .where(and(eq(schema.media.id, id), eq(schema.media.organizationId, organizationId)))
            .returning();
        return updated;
    }

    async incrementPlayCount(id: string, organizationId: string): Promise<void> {
        const { sql } = await import("drizzle-orm");
        await this.db
            .update(schema.media)
            .set({ playCount: sql`${schema.media.playCount} + 1` })
            .where(and(eq(schema.media.id, id), eq(schema.media.organizationId, organizationId)));
    }

    async delete(id: string, organizationId: string): Promise<boolean> {
        const result = await this.db
            .delete(schema.media)
            .where(and(eq(schema.media.id, id), eq(schema.media.organizationId, organizationId)))
            .returning();
        return result.length > 0;
    }
}
