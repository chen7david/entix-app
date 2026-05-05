import type { EntixQueueMessage } from "@api/queues/entix.queue";
import { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import { VocabularyBankRepository } from "@api/repositories/vocabulary-bank.repository";
import { generateAuditId, PLATFORM_ORGANIZATION_ID } from "@shared";
import * as schema from "@shared/db/schema";
import { drizzle } from "drizzle-orm/d1";

const STALE_AFTER_MS = 15 * 60 * 1000; // 15 min before considering processing_* as stuck

/**
 * Cron-driven pipeline dispatcher. Runs every minute and:
 * 1. Immediately dispatches `new` → process-text, `text_ready` → process-audio
 * 2. Re-dispatches `processing_text` / `processing_audio` stuck > 15 min (crash recovery)
 *
 * This is the ONLY place queue messages are sent for vocabulary processing.
 * Queue handlers purely do work and update status — they never chain to the next stage.
 */
export async function driveVocabularyPipeline(env: CloudflareBindings): Promise<void> {
    const db = drizzle(env.DB, { schema });
    const vocabularyRepo = new VocabularyBankRepository(db);
    const auditRepo = new SystemAuditRepository(db);

    const cutoff = new Date(Date.now() - STALE_AFTER_MS);

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
        const msg: EntixQueueMessage =
            row.status === "text_ready" || row.status === "processing_audio"
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
