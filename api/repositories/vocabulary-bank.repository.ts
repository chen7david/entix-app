import type { AppDb } from "@api/factories/db.factory";
import { buildCursorPagination, encodeCursor } from "@api/helpers/pagination.helpers";
import {
    type VocabularyBankItem,
    type VocabularyBankStatus,
    vocabularyBank,
} from "@shared/db/schema";
import { and, eq, lt, or, sql } from "drizzle-orm";

export type VocabularyBankUpdateInput = Omit<
    typeof vocabularyBank.$inferInsert,
    "id" | "createdAt" | "updatedAt"
>;

export class VocabularyBankRepository {
    constructor(private readonly db: AppDb) {}

    async findOrCreate(text: string): Promise<VocabularyBankItem | null> {
        const trimmedText = text.trim();

        await this.db
            .insert(vocabularyBank)
            .values({
                text: trimmedText,
                status: "new",
            })
            .onConflictDoNothing();

        const [item] = await this.db
            .select()
            .from(vocabularyBank)
            .where(eq(vocabularyBank.text, trimmedText))
            .limit(1);

        return item ?? null;
    }

    async findById(id: string): Promise<VocabularyBankItem | null> {
        const [item] = await this.db
            .select()
            .from(vocabularyBank)
            .where(eq(vocabularyBank.id, id))
            .limit(1);

        return item ?? null;
    }

    async findByText(text: string): Promise<VocabularyBankItem | null> {
        const [item] = await this.db
            .select()
            .from(vocabularyBank)
            .where(eq(vocabularyBank.text, text))
            .limit(1);

        return item ?? null;
    }

    async update(
        id: string,
        data: Partial<VocabularyBankUpdateInput>
    ): Promise<VocabularyBankItem | null> {
        const [item] = await this.db
            .update(vocabularyBank)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(vocabularyBank.id, id))
            .returning();

        return item ?? null;
    }

    async updateStatus(
        id: string,
        status: VocabularyBankStatus
    ): Promise<VocabularyBankItem | null> {
        return this.update(id, { status });
    }

    async getByStatus(status: VocabularyBankStatus, limit = 50): Promise<VocabularyBankItem[]> {
        return this.db
            .select()
            .from(vocabularyBank)
            .where(eq(vocabularyBank.status, status))
            .limit(limit);
    }

    async getReviewItems(
        params: {
            limit?: number;
            direction?: "next" | "prev";
            cursorUpdatedAt?: number;
            cursorId?: string;
        } = {}
    ) {
        const { limit = 50, direction = "next", cursorUpdatedAt, cursorId } = params;
        const cursor =
            cursorUpdatedAt !== undefined
                ? encodeCursor({
                      primary: cursorUpdatedAt,
                      ...(cursorId ? { secondary: cursorId } : {}),
                  })
                : undefined;
        const pagination = buildCursorPagination(
            vocabularyBank.updatedAt,
            vocabularyBank.id,
            cursor,
            direction
        );
        const conditions = [eq(vocabularyBank.status, "review")];
        if (pagination.where) {
            conditions.push(pagination.where);
        }

        return this.db
            .select()
            .from(vocabularyBank)
            .where(and(...conditions))
            .orderBy(...pagination.orderBy)
            .limit(limit);
    }

    /**
     * Items stuck in text/audio processing (e.g. transient AI/TTS failure).
     * Caller should re-enqueue queue messages for retry.
     */
    async findStaleProcessing(olderThan: Date, limit = 40): Promise<VocabularyBankItem[]> {
        return this.db
            .select()
            .from(vocabularyBank)
            .where(
                and(
                    or(
                        eq(vocabularyBank.status, "processing_text"),
                        eq(vocabularyBank.status, "processing_audio")
                    ),
                    lt(vocabularyBank.updatedAt, olderThan)
                )
            )
            .limit(limit);
    }

    async listAll(params: {
        limit: number;
        direction: "next" | "prev";
        cursorUpdatedAt?: number;
        cursorId?: string;
        search?: string;
    }) {
        const { limit, direction, cursorUpdatedAt, cursorId, search } = params;
        const cursor =
            cursorUpdatedAt !== undefined
                ? encodeCursor({
                      primary: cursorUpdatedAt,
                      ...(cursorId ? { secondary: cursorId } : {}),
                  })
                : undefined;
        const pagination = buildCursorPagination(
            vocabularyBank.updatedAt,
            vocabularyBank.id,
            cursor,
            direction
        );
        const conditions = [];
        if (search) {
            conditions.push(
                sql`LOWER(${vocabularyBank.text}) LIKE ${`%${search.trim().toLowerCase()}%`}`
            );
        }
        if (pagination.where) {
            conditions.push(pagination.where);
        }

        return this.db
            .select()
            .from(vocabularyBank)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(...pagination.orderBy)
            .limit(limit);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.db
            .delete(vocabularyBank)
            .where(eq(vocabularyBank.id, id))
            .returning();
        return result.length > 0;
    }
}
