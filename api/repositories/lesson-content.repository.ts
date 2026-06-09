import { UnprocessableEntityError } from "@api/errors/app.error";
import type { AppDb } from "@api/factories/db.factory";
import type { LessonObjective, LessonPlaylist, LessonVocabulary } from "@shared/db/schema";
import {
    lessonObjectives,
    lessonPassages,
    lessonPlaylists,
    lessonVocabulary,
    passages,
} from "@shared/db/schema";
import { generateOpaqueId } from "@shared/lib/id";
import { and, asc, eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

/**
 * Offset applied during two-phase position updates to avoid transient unique-position
 * conflicts in SQLite/D1 (reorder and compact after remove).
 */
const REORDER_POSITION_OFFSET = 900_000;

export class LessonContentRepository {
    private readonly passageLinkSelect = {
        lessonId: lessonPassages.lessonId,
        passageId: lessonPassages.passageId,
        position: lessonPassages.position,
        addedAt: lessonPassages.addedAt,
        title: passages.title,
        type: passages.type,
        cefrLevel: passages.cefrLevel,
        wordCount: passages.wordCount,
    };

    constructor(private readonly db: AppDb) {}

    async listObjectives(lessonId: string) {
        return this.db
            .select()
            .from(lessonObjectives)
            .where(eq(lessonObjectives.lessonId, lessonId))
            .orderBy(asc(lessonObjectives.position));
    }

    async replaceObjectives(lessonId: string, objectives: string[]): Promise<LessonObjective[]> {
        const now = new Date();
        const rows = objectives.map((text, i) => ({
            id: generateOpaqueId(),
            lessonId,
            objective: text,
            position: i + 1,
            createdAt: now,
            updatedAt: now,
        }));

        const deleteStmt = this.db
            .delete(lessonObjectives)
            .where(eq(lessonObjectives.lessonId, lessonId));

        if (rows.length === 0) {
            await this.db.batch([deleteStmt] as [typeof deleteStmt]);
            return [];
        }

        const insertStmt = this.db.insert(lessonObjectives).values(rows).returning();
        const batchResult = await this.db.batch([deleteStmt, insertStmt] as [
            typeof deleteStmt,
            typeof insertStmt,
        ]);
        return batchResult[1] as LessonObjective[];
    }

    async reorderObjectives(lessonId: string, orderedIds: string[]): Promise<LessonObjective[]> {
        if (orderedIds.length === 0) {
            return this.listObjectives(lessonId);
        }
        const phase1 = orderedIds.map((id, i) =>
            this.db
                .update(lessonObjectives)
                .set({ updatedAt: new Date(), position: REORDER_POSITION_OFFSET + i })
                .where(and(eq(lessonObjectives.id, id), eq(lessonObjectives.lessonId, lessonId)))
        ) as BatchItem<"sqlite">[];
        await this.db.batch(phase1 as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
        const phase2 = orderedIds.map((id, i) =>
            this.db
                .update(lessonObjectives)
                .set({ updatedAt: new Date(), position: i + 1 })
                .where(and(eq(lessonObjectives.id, id), eq(lessonObjectives.lessonId, lessonId)))
        ) as BatchItem<"sqlite">[];
        await this.db.batch(phase2 as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
        return this.listObjectives(lessonId);
    }

    async listPlaylists(lessonId: string) {
        return this.db
            .select()
            .from(lessonPlaylists)
            .where(eq(lessonPlaylists.lessonId, lessonId))
            .orderBy(asc(lessonPlaylists.position));
    }

    async addPlaylist(lessonId: string, playlistId: string, position: number) {
        const [row] = await this.db
            .insert(lessonPlaylists)
            .values({ lessonId, playlistId, position, addedAt: new Date() })
            .onConflictDoNothing()
            .returning();
        return row ?? null;
    }

    async reorderPlaylists(
        lessonId: string,
        orderedPlaylistIds: string[]
    ): Promise<LessonPlaylist[]> {
        if (orderedPlaylistIds.length === 0) {
            return this.listPlaylists(lessonId);
        }
        const phase1 = orderedPlaylistIds.map((playlistId, i) =>
            this.db
                .update(lessonPlaylists)
                .set({ position: REORDER_POSITION_OFFSET + i })
                .where(
                    and(
                        eq(lessonPlaylists.lessonId, lessonId),
                        eq(lessonPlaylists.playlistId, playlistId)
                    )
                )
        ) as BatchItem<"sqlite">[];
        await this.db.batch(phase1 as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
        const phase2 = orderedPlaylistIds.map((playlistId, i) =>
            this.db
                .update(lessonPlaylists)
                .set({ position: i + 1 })
                .where(
                    and(
                        eq(lessonPlaylists.lessonId, lessonId),
                        eq(lessonPlaylists.playlistId, playlistId)
                    )
                )
        ) as BatchItem<"sqlite">[];
        await this.db.batch(phase2 as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
        return this.listPlaylists(lessonId);
    }

    async removePlaylist(lessonId: string, playlistId: string) {
        const result = await this.db
            .delete(lessonPlaylists)
            .where(
                and(
                    eq(lessonPlaylists.lessonId, lessonId),
                    eq(lessonPlaylists.playlistId, playlistId)
                )
            )
            .returning({ lessonId: lessonPlaylists.lessonId });
        return result.length > 0;
    }

    async listVocabulary(lessonId: string) {
        return this.db
            .select()
            .from(lessonVocabulary)
            .where(eq(lessonVocabulary.lessonId, lessonId))
            .orderBy(asc(lessonVocabulary.position));
    }

    async addVocabulary(lessonId: string, vocabularyId: string, position: number) {
        const [row] = await this.db
            .insert(lessonVocabulary)
            .values({ lessonId, vocabularyId, position, addedAt: new Date() })
            .onConflictDoNothing()
            .returning();
        return row ?? null;
    }

    async reorderVocabulary(
        lessonId: string,
        orderedVocabularyIds: string[]
    ): Promise<LessonVocabulary[]> {
        if (orderedVocabularyIds.length === 0) {
            return this.listVocabulary(lessonId);
        }
        const phase1 = orderedVocabularyIds.map((vocabularyId, i) =>
            this.db
                .update(lessonVocabulary)
                .set({ position: REORDER_POSITION_OFFSET + i })
                .where(
                    and(
                        eq(lessonVocabulary.lessonId, lessonId),
                        eq(lessonVocabulary.vocabularyId, vocabularyId)
                    )
                )
        ) as BatchItem<"sqlite">[];
        await this.db.batch(phase1 as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
        const phase2 = orderedVocabularyIds.map((vocabularyId, i) =>
            this.db
                .update(lessonVocabulary)
                .set({ position: i + 1 })
                .where(
                    and(
                        eq(lessonVocabulary.lessonId, lessonId),
                        eq(lessonVocabulary.vocabularyId, vocabularyId)
                    )
                )
        ) as BatchItem<"sqlite">[];
        await this.db.batch(phase2 as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
        return this.listVocabulary(lessonId);
    }

    async removeVocabulary(lessonId: string, vocabularyId: string) {
        const result = await this.db
            .delete(lessonVocabulary)
            .where(
                and(
                    eq(lessonVocabulary.lessonId, lessonId),
                    eq(lessonVocabulary.vocabularyId, vocabularyId)
                )
            )
            .returning({ lessonId: lessonVocabulary.lessonId });
        return result.length > 0;
    }

    /**
     * Lesson passage links with passage metadata only (no `content` / `bucketKey` bodies).
     */
    async listPassages(lessonId: string) {
        return this.db
            .select(this.passageLinkSelect)
            .from(lessonPassages)
            .innerJoin(passages, eq(passages.id, lessonPassages.passageId))
            .where(eq(lessonPassages.lessonId, lessonId))
            .orderBy(asc(lessonPassages.position));
    }

    private async findPassageLink(lessonId: string, passageId: string) {
        const [row] = await this.db
            .select(this.passageLinkSelect)
            .from(lessonPassages)
            .innerJoin(passages, eq(passages.id, lessonPassages.passageId))
            .where(
                and(eq(lessonPassages.lessonId, lessonId), eq(lessonPassages.passageId, passageId))
            );
        return row ?? null;
    }

    async hasPassageLink(lessonId: string, passageId: string): Promise<boolean> {
        const row = await this.db.query.lessonPassages.findFirst({
            where: and(
                eq(lessonPassages.lessonId, lessonId),
                eq(lessonPassages.passageId, passageId)
            ),
        });
        return row != null;
    }

    /**
     * Assigns the next position via MAX+1 subquery in a single insert.
     *
     * D1 serialises writes per-database; the subquery is safe under concurrent Worker
     * requests because each HTTP request to D1 is handled atomically. If this assumption
     * changes, add UNIQUE(lesson_id, position) and retry on conflict.
     */
    async addPassage(lessonId: string, passageId: string) {
        await this.db.insert(lessonPassages).values({
            lessonId,
            passageId,
            position: sql`(SELECT coalesce(max(${lessonPassages.position}), 0) + 1 FROM ${lessonPassages} WHERE ${lessonPassages.lessonId} = ${lessonId})`,
            addedAt: new Date(),
        });
        return this.findPassageLink(lessonId, passageId);
    }

    async compactPassagePositions(lessonId: string): Promise<void> {
        const rows = await this.db
            .select({ passageId: lessonPassages.passageId })
            .from(lessonPassages)
            .where(eq(lessonPassages.lessonId, lessonId))
            .orderBy(asc(lessonPassages.position));
        if (rows.length <= 1) {
            return;
        }
        const phase1 = rows.map((r, i) =>
            this.db
                .update(lessonPassages)
                .set({ position: REORDER_POSITION_OFFSET + i })
                .where(
                    and(
                        eq(lessonPassages.lessonId, lessonId),
                        eq(lessonPassages.passageId, r.passageId)
                    )
                )
        ) as BatchItem<"sqlite">[];
        await this.db.batch(phase1 as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
        const phase2 = rows.map((r, i) =>
            this.db
                .update(lessonPassages)
                .set({ position: i + 1 })
                .where(
                    and(
                        eq(lessonPassages.lessonId, lessonId),
                        eq(lessonPassages.passageId, r.passageId)
                    )
                )
        ) as BatchItem<"sqlite">[];
        await this.db.batch(phase2 as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
    }

    /**
     * Reorders lesson passages to 1..N.
     *
     * @precondition `orderedPassageIds` must exactly match current passage IDs for this lesson.
     */
    async reorderPassages(lessonId: string, orderedPassageIds: string[]) {
        const current = await this.listPassages(lessonId);
        const currentIdSet = new Set(current.map((r) => r.passageId));
        for (const id of orderedPassageIds) {
            if (!currentIdSet.has(id)) {
                throw new UnprocessableEntityError("orderedIds must match the current items");
            }
        }
        if (orderedPassageIds.length !== current.length) {
            throw new UnprocessableEntityError("orderedIds must include each item exactly once");
        }
        const phase1 = orderedPassageIds.map((passageId, i) =>
            this.db
                .update(lessonPassages)
                .set({ position: REORDER_POSITION_OFFSET + i })
                .where(
                    and(
                        eq(lessonPassages.lessonId, lessonId),
                        eq(lessonPassages.passageId, passageId)
                    )
                )
        ) as BatchItem<"sqlite">[];
        await this.db.batch(phase1 as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
        const phase2 = orderedPassageIds.map((passageId, i) =>
            this.db
                .update(lessonPassages)
                .set({ position: i + 1 })
                .where(
                    and(
                        eq(lessonPassages.lessonId, lessonId),
                        eq(lessonPassages.passageId, passageId)
                    )
                )
        ) as BatchItem<"sqlite">[];
        await this.db.batch(phase2 as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
        return this.listPassages(lessonId);
    }

    async removePassage(lessonId: string, passageId: string) {
        const result = await this.db
            .delete(lessonPassages)
            .where(
                and(eq(lessonPassages.lessonId, lessonId), eq(lessonPassages.passageId, passageId))
            )
            .returning({ lessonId: lessonPassages.lessonId });
        if (result.length === 0) {
            return false;
        }
        await this.compactPassagePositions(lessonId);
        return true;
    }
}
