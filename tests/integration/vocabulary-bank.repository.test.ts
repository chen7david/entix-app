import { VocabularyBankRepository } from "@api/repositories/vocabulary-bank.repository";
import { VOCABULARY_PIPELINE_STALE_AFTER_MS } from "@api/scheduled/handlers/vocabulary-pipeline.scheduled";
import { vocabularyBank } from "@shared/db/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../lib/utils";

describe("VocabularyBankRepository (integration)", () => {
    let db: Awaited<ReturnType<typeof createTestDb>>;

    beforeEach(async () => {
        db = await createTestDb();
    });

    it("findStaleProcessing returns stale queued_text and queued_audio rows", async () => {
        const repo = new VocabularyBankRepository(db);
        const cutoff = new Date(Date.now() - VOCABULARY_PIPELINE_STALE_AFTER_MS);
        const staleUpdatedAt = new Date(Date.now() - VOCABULARY_PIPELINE_STALE_AFTER_MS - 60_000);
        const recentUpdatedAt = new Date();

        await db.insert(vocabularyBank).values([
            {
                id: "vb_qt_stale",
                text: "stale-queued-text-phrase",
                status: "queued_text",
                createdAt: staleUpdatedAt,
                updatedAt: staleUpdatedAt,
            },
            {
                id: "vb_qa_stale",
                text: "stale-queued-audio-phrase",
                zhTranslation: "占位",
                status: "queued_audio",
                createdAt: staleUpdatedAt,
                updatedAt: staleUpdatedAt,
            },
            {
                id: "vb_qt_recent",
                text: "fresh-queued-text-phrase",
                status: "queued_text",
                createdAt: recentUpdatedAt,
                updatedAt: recentUpdatedAt,
            },
            {
                id: "vb_new_only",
                text: "new-not-stale-processing",
                status: "new",
                createdAt: staleUpdatedAt,
                updatedAt: staleUpdatedAt,
            },
        ]);

        const stale = await repo.findStaleProcessing(cutoff, 40);
        const ids = new Set(stale.map((r) => r.id));

        expect(ids.has("vb_qt_stale")).toBe(true);
        expect(ids.has("vb_qa_stale")).toBe(true);
        expect(ids.has("vb_qt_recent")).toBe(false);
        expect(ids.has("vb_new_only")).toBe(false);
        expect(stale.every((r) => ["queued_text", "queued_audio"].includes(r.status))).toBe(true);
    });
});
