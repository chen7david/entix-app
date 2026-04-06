import type { AppDb } from "@api/factories/db.factory";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";
import * as schema from "@shared/db/schema";
import { and, eq, like, or, type SQL } from "drizzle-orm";

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

import { mapCategoryToMimePattern, wrapWildcard } from "@api/helpers/db.helpers";

export class MediaRepository {
    constructor(private db: AppDb) {}

    async create(input: CreateMediaInput): Promise<schema.Media> {
        const [media] = await this.db.insert(schema.media).values(input).returning();
        return media;
    }

    async findById(id: string, organizationId: string): Promise<schema.Media | null> {
        const media = await this.db.query.media.findFirst({
            where: and(eq(schema.media.id, id), eq(schema.media.organizationId, organizationId)),
        });
        return media ?? null;
    }

    async findAllByOrganization(
        organizationId: string,
        filters: {
            limit: number;
            cursor?: string;
            direction?: "next" | "prev";
            search?: string;
            type?: string;
        }
    ) {
        const { limit, cursor, direction = "next", search, type } = filters;
        const { where: cursorWhere, orderBy } = buildCursorPagination(
            schema.media.createdAt,
            schema.media.id,
            cursor,
            direction
        );

        const conditions: (SQL | undefined)[] = [eq(schema.media.organizationId, organizationId)];

        const mimePattern = mapCategoryToMimePattern(type);
        if (mimePattern) {
            conditions.push(like(schema.media.mimeType, mimePattern));
        }

        if (search) {
            const pattern = wrapWildcard(search);
            conditions.push(
                or(like(schema.media.title, pattern), like(schema.media.description, pattern))
            );
        }

        if (cursorWhere) {
            conditions.push(cursorWhere);
        }

        const finalFilters = conditions.filter((c): c is SQL => c !== undefined);

        const items = await this.db
            .select()
            .from(schema.media)
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
        updates: Partial<Pick<schema.Media, "title" | "description" | "coverArtUrl">>
    ): Promise<schema.Media | null> {
        const [updated] = await this.db
            .update(schema.media)
            .set({ ...updates, updatedAt: new Date() })
            .where(and(eq(schema.media.id, id), eq(schema.media.organizationId, organizationId)))
            .returning();
        return updated ?? null;
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
