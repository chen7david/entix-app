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
     * Words in `new` or `text_ready` — ready to be dispatched immediately.
     * No time threshold needed; cron drives these forward on every tick.
     */
    async findPendingDispatch(limit = 40): Promise<VocabularyBankItem[]> {
        return this.db
            .select()
            .from(vocabularyBank)
            .where(or(eq(vocabularyBank.status, "new"), eq(vocabularyBank.status, "text_ready")))
            .limit(limit);
    }

    /**
     * Atomically transitions `new` → `queued_text` or `text_ready` → `queued_audio`.
     * Returns null if status no longer matches (another tick claimed first).
     */
    async claimForDispatch(
        id: string,
        fromStatus: "new" | "text_ready"
    ): Promise<VocabularyBankItem | null> {
        const toStatus: VocabularyBankStatus =
            fromStatus === "new" ? "queued_text" : "queued_audio";
        const [claimed] = await this.db
            .update(vocabularyBank)
            .set({ status: toStatus, updatedAt: new Date() })
            .where(and(eq(vocabularyBank.id, id), eq(vocabularyBank.status, fromStatus)))
            .returning();
        return claimed ?? null;
    }

    /**
     * Rows the dispatcher should retry without another DB claim (`processing_*` and `queued_*`).
     *
     * - `processing_*`: worker started but stalled (crash, hung job, infra) — historically the main case.
     * - `queued_*`: cron claimed (`new`→`queued_text`, `text_ready`→`queued_audio`) but the consumer never
     *   advanced status — e.g. queue send succeeded but delivery failed, worker never ran, or `QUEUE.send`
     *   failed after the claim. These were never reliably "mid-flight" work; treat like lost dispatch.
     *
     * Matches `updatedAt < olderThan` (callers should pass the same cutoff as
     * `VOCABULARY_PIPELINE_STALE_AFTER_MS` in `driveVocabularyPipeline`).
     * Caller should re-enqueue queue messages without `claimForDispatch` (already out of `new`/`text_ready`).
     */
    async findStaleProcessing(olderThan: Date, limit = 40): Promise<VocabularyBankItem[]> {
        return this.db
            .select()
            .from(vocabularyBank)
            .where(
                and(
                    or(
                        eq(vocabularyBank.status, "processing_text"),
                        eq(vocabularyBank.status, "processing_audio"),
                        eq(vocabularyBank.status, "queued_text"),
                        eq(vocabularyBank.status, "queued_audio")
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
