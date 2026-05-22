import type { AppDb } from "@api/factories/db.factory";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";
import * as schema from "@shared/db/schema";
import type {
    NewPassage,
    NewPassageImage,
    NewTextCollection,
    PassageImage,
    PassageType,
    TextCollectionType,
} from "@shared/db/schema";
import { and, asc, eq, type SQL } from "drizzle-orm";

export class PassageRepository {
    constructor(private readonly db: AppDb) {}

    async createCollection(data: NewTextCollection) {
        const [row] = await this.db.insert(schema.textCollections).values(data).returning();
        return row;
    }

    async findCollectionById(organizationId: string, id: string) {
        const row = await this.db.query.textCollections.findFirst({
            where: and(
                eq(schema.textCollections.id, id),
                eq(schema.textCollections.organizationId, organizationId)
            ),
        });
        return row ?? null;
    }

    async listCollectionsPaginated(
        organizationId: string,
        filters: {
            type?: TextCollectionType;
            cursor?: string;
            limit?: number;
            direction?: "next" | "prev";
        }
    ) {
        const { type, cursor, limit = 20, direction = "next" } = filters;
        const { where: cursorWhere, orderBy } = buildCursorPagination(
            schema.textCollections.createdAt,
            schema.textCollections.id,
            cursor,
            direction
        );

        const conditions: (SQL | undefined)[] = [
            eq(schema.textCollections.organizationId, organizationId),
        ];
        if (type) {
            conditions.push(eq(schema.textCollections.type, type));
        }
        if (cursorWhere) {
            conditions.push(cursorWhere);
        }

        const finalFilters = conditions.filter((c): c is SQL => c !== undefined);
        const items = await this.db
            .select()
            .from(schema.textCollections)
            .where(and(...finalFilters))
            .orderBy(...orderBy)
            .limit(limit + 1);

        return processPaginatedResult(
            items,
            limit,
            direction,
            (row) => ({
                primary: row.createdAt.getTime(),
                secondary: row.id,
            }),
            cursor
        );
    }

    async updateCollection(
        organizationId: string,
        id: string,
        data: Partial<Omit<NewTextCollection, "id" | "organizationId">>
    ) {
        const [row] = await this.db
            .update(schema.textCollections)
            .set({ ...data, updatedAt: new Date() })
            .where(
                and(
                    eq(schema.textCollections.id, id),
                    eq(schema.textCollections.organizationId, organizationId)
                )
            )
            .returning();
        return row ?? null;
    }

    async deleteCollection(organizationId: string, id: string) {
        const result = await this.db
            .delete(schema.textCollections)
            .where(
                and(
                    eq(schema.textCollections.id, id),
                    eq(schema.textCollections.organizationId, organizationId)
                )
            )
            .returning({ id: schema.textCollections.id });
        return result.length > 0;
    }

    async createPassage(data: NewPassage) {
        const [row] = await this.db.insert(schema.passages).values(data).returning();
        return row;
    }

    async findPassageById(organizationId: string, id: string) {
        const row = await this.db.query.passages.findFirst({
            where: and(
                eq(schema.passages.id, id),
                eq(schema.passages.organizationId, organizationId)
            ),
        });
        return row ?? null;
    }

    async listPassagesPaginated(
        organizationId: string,
        filters: {
            collectionId?: string;
            type?: PassageType;
            cefrLevel?: string;
            cursor?: string;
            limit?: number;
            direction?: "next" | "prev";
        }
    ) {
        const { collectionId, type, cefrLevel, cursor, limit = 20, direction = "next" } = filters;
        const { where: cursorWhere, orderBy } = buildCursorPagination(
            schema.passages.createdAt,
            schema.passages.id,
            cursor,
            direction
        );

        const conditions: (SQL | undefined)[] = [
            eq(schema.passages.organizationId, organizationId),
        ];
        if (collectionId) {
            conditions.push(eq(schema.passages.collectionId, collectionId));
        }
        if (type) {
            conditions.push(eq(schema.passages.type, type));
        }
        if (cefrLevel) {
            conditions.push(eq(schema.passages.cefrLevel, cefrLevel));
        }
        if (cursorWhere) {
            conditions.push(cursorWhere);
        }

        const finalFilters = conditions.filter((c): c is SQL => c !== undefined);
        const items = await this.db
            .select()
            .from(schema.passages)
            .where(and(...finalFilters))
            .orderBy(...orderBy)
            .limit(limit + 1);

        return processPaginatedResult(
            items,
            limit,
            direction,
            (row) => ({
                primary: row.createdAt.getTime(),
                secondary: row.id,
            }),
            cursor
        );
    }

    async updatePassage(
        organizationId: string,
        id: string,
        data: Partial<Omit<NewPassage, "id" | "organizationId">>
    ) {
        const [row] = await this.db
            .update(schema.passages)
            .set({ ...data, updatedAt: new Date() })
            .where(
                and(
                    eq(schema.passages.id, id),
                    eq(schema.passages.organizationId, organizationId)
                )
            )
            .returning();
        return row ?? null;
    }

    async deletePassage(organizationId: string, id: string) {
        const result = await this.db
            .delete(schema.passages)
            .where(
                and(
                    eq(schema.passages.id, id),
                    eq(schema.passages.organizationId, organizationId)
                )
            )
            .returning({ id: schema.passages.id });
        return result.length > 0;
    }

    async addPassageImage(data: NewPassageImage): Promise<PassageImage> {
        const [row] = await this.db.insert(schema.passageImages).values(data).returning();
        return row;
    }

    /** Caller must verify org ownership via `findPassageById` before use. */
    async listPassageImages(passageId: string) {
        return this.db
            .select()
            .from(schema.passageImages)
            .where(eq(schema.passageImages.passageId, passageId))
            .orderBy(asc(schema.passageImages.sortOrder));
    }

    async deletePassageImage(id: string, passageId: string) {
        const result = await this.db
            .delete(schema.passageImages)
            .where(
                and(eq(schema.passageImages.id, id), eq(schema.passageImages.passageId, passageId))
            )
            .returning({ id: schema.passageImages.id });
        return result.length > 0;
    }
}
