import type { EntixQueueMessage } from "@api/queues/entix.queue";
import { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import { VocabularyBankRepository } from "@api/repositories/vocabulary-bank.repository";
import { generateAuditId, PLATFORM_ORGANIZATION_ID } from "@shared";
import * as schema from "@shared/db/schema";
import { drizzle } from "drizzle-orm/d1";

const STALE_AFTER_MS = 3 * 60 * 1000;

/**
 * Re-enqueues vocabulary pipeline work that failed transiently and remained in
 * `processing_text` or `processing_audio` (see VocabularyProcessingService).
 */
export async function retryStuckVocabularyProcessing(env: CloudflareBindings): Promise<void> {
    const db = drizzle(env.DB, { schema });
    const vocabularyRepo = new VocabularyBankRepository(db);
    const auditRepo = new SystemAuditRepository(db);

    const cutoff = new Date(Date.now() - STALE_AFTER_MS);
    const stale = await vocabularyRepo.findStaleProcessing(cutoff, 40);

    let enqueued = 0;
    for (const row of stale) {
        const msg: EntixQueueMessage =
            row.status === "processing_audio"
                ? { type: "vocabulary.process-audio", vocabularyId: row.id }
                : { type: "vocabulary.process-text", vocabularyId: row.id };
        await env.QUEUE.send(msg);
        enqueued++;
    }

    if (enqueued > 0) {
        await auditRepo.insert({
            id: generateAuditId(),
            organizationId: PLATFORM_ORGANIZATION_ID,
            eventType: "vocabulary.retry_scheduled",
            severity: "info",
            actorType: "system",
            subjectType: "vocabulary_bank",
            subjectId: "batch",
            message: `Re-enqueued ${enqueued} stuck vocabulary pipeline job(s)`,
            metadata: JSON.stringify({
                cutoffMs: cutoff.getTime(),
                staleStatuses: ["processing_text", "processing_audio"],
                count: enqueued,
            }),
        });
        console.log(`[Scheduled:VocabularyRetry] Re-enqueued ${enqueued} messages`);
    }
}
