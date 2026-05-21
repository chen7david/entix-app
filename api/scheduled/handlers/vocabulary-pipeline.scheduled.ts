import type { EntixQueueMessage } from "@api/queues/entix.queue";
import { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import { VocabularyBankRepository } from "@api/repositories/vocabulary-bank.repository";
import { generateAuditId, PLATFORM_ORGANIZATION_ID } from "@shared";
import * as schema from "@shared/db/schema";
import { drizzle } from "drizzle-orm/d1";

/** Stale cutoff for re-dispatch of stuck pipeline rows (shared with integration tests). */
export const VOCABULARY_PIPELINE_STALE_AFTER_MS = 15 * 60 * 1000; // 15 min

/**
 * Cron-driven pipeline dispatcher. Runs every minute and:
 * 1. Atomically claims `new` → `queued_text` / `text_ready` → `queued_audio`, then enqueues work
 * 2. Re-dispatches stuck `processing_*` / `queued_*` older than `VOCABULARY_PIPELINE_STALE_AFTER_MS`
 *
 * This is the ONLY place queue messages are sent for vocabulary processing.
 * Queue handlers purely do work and update status — they never chain to the next stage.
 */
export async function driveVocabularyPipeline(env: CloudflareBindings): Promise<void> {
    const db = drizzle(env.DB, { schema });
    const vocabularyRepo = new VocabularyBankRepository(db);
    const auditRepo = new SystemAuditRepository(db);

    const cutoff = new Date(Date.now() - VOCABULARY_PIPELINE_STALE_AFTER_MS);

    const [pending, stale] = await Promise.all([
        vocabularyRepo.findPendingDispatch(40),
        vocabularyRepo.findStaleProcessing(cutoff, 40),
    ]);

    const toDispatch = [
        ...pending,
        // exclude any stale item already covered by pending (shouldn't overlap but be safe)
        ...stale.filter((s) => !pending.some((p) => p.id === s.id)),
    ];

    let enqueued = 0;
    for (const row of toDispatch) {
        const isStaleRetry =
            row.status === "processing_text" ||
            row.status === "processing_audio" ||
            row.status === "queued_text" ||
            row.status === "queued_audio";

        if (!isStaleRetry) {
            if (row.status !== "new" && row.status !== "text_ready") {
                continue;
            }
            const claimed = await vocabularyRepo.claimForDispatch(
                row.id,
                row.status as "new" | "text_ready"
            );
            if (!claimed) {
                continue;
            }
        }

        const isAudio =
            row.status === "text_ready" ||
            row.status === "processing_audio" ||
            row.status === "queued_audio";

        const msg: EntixQueueMessage = isAudio
            ? { type: "vocabulary.process-audio", vocabularyId: row.id }
            : { type: "vocabulary.process-text", vocabularyId: row.id };

        await env.QUEUE.send(msg);
        enqueued++;
    }

    if (enqueued > 0) {
        await auditRepo.insert({
            id: generateAuditId(),
            organizationId: PLATFORM_ORGANIZATION_ID,
            eventType: "vocabulary.pipeline_dispatched",
            severity: "info",
            actorType: "system",
            subjectType: "vocabulary_bank",
            subjectId: "batch",
            message: `Dispatched ${enqueued} vocabulary pipeline job(s)`,
            metadata: JSON.stringify({
                pending: pending.length,
                stale: stale.length,
                cutoffMs: cutoff.getTime(),
            }),
        });
        console.log(`[Scheduled:VocabularyPipeline] Dispatched ${enqueued} jobs`);
    }
}
