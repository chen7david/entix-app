import type { AppDb } from "@api/factories/db.factory";
import type { LessonObjective, LessonPlaylist, LessonVocabulary } from "@shared/db/schema";
import { lessonObjectives, lessonPlaylists, lessonVocabulary } from "@shared/db/schema";
import { generateOpaqueId } from "@shared/lib/id";
import { and, asc, eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

/** Avoid unique (lesson_id, position) violations while reordering multiple rows in SQLite/D1. */
const REORDER_POSITION_OFFSET = 900_000;

export class LessonContentRepository {
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
}
