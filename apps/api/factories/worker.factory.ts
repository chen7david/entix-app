import { InternalServerError } from "@api/errors/app.error";
import { createAiServiceFromEnv } from "@api/factories/ai.factory";
import { getBucketClientFromEnv } from "@api/factories/bucket.factory";
import type { AppDb } from "@api/factories/db.factory";
import { DbBatchRunner } from "@api/helpers/batch-runner";
import { FinanceBillingPlansRepository } from "@api/repositories/financial/finance-billing-plans.repository";
import { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import { SystemAuditRepository } from "@api/repositories/infra/system-audit.repository";
import { UploadRepository } from "@api/repositories/media/upload.repository";
import { PaymentQueueRepository } from "@api/repositories/payment/payment-queue.repository";
import { SessionAttendancesRepository } from "@api/repositories/schedule/session-attendances.repository";
import { VocabularyBankRepository } from "@api/repositories/vocabulary/vocabulary-bank.repository";
import { SessionPaymentService } from "@api/services/financial/session-payment.service";
import { parseGoogleTtsCredentials, TtsService } from "@api/services/media/tts.service";
import {
    VOCABULARY_TRANSLATION_INSTRUCTIONS,
    VocabularyProcessingService,
} from "@api/services/vocabulary/vocabulary-processing.service";
import { generateAuditId, PLATFORM_ORGANIZATION_ID } from "@shared";
import * as schema from "@shared/db/schema";
import { drizzle } from "drizzle-orm/d1";

/** Drizzle client for queue/scheduled handlers (no Hono AppContext). */
export const getWorkerDb = (env: CloudflareBindings): AppDb => {
    return drizzle(env.DB, { schema, logger: false });
};

export const getPaymentQueueRepositoryFromEnv = (env: CloudflareBindings) => {
    return new PaymentQueueRepository(getWorkerDb(env));
};

export const getSystemAuditRepositoryFromEnv = (env: CloudflareBindings) => {
    return new SystemAuditRepository(getWorkerDb(env));
};

export const getVocabularyBankRepositoryFromEnv = (env: CloudflareBindings) => {
    return new VocabularyBankRepository(getWorkerDb(env));
};

export const getUploadRepositoryFromEnv = (env: CloudflareBindings) => {
    return new UploadRepository(getWorkerDb(env));
};

export const getSessionPaymentServiceFromEnv = (env: CloudflareBindings): SessionPaymentService => {
    const db = getWorkerDb(env);
    const paymentQueueRepo = new PaymentQueueRepository(db);
    const auditRepo = new SystemAuditRepository(db);
    return new SessionPaymentService(
        new DbBatchRunner(db),
        new FinancialTransactionsRepository(db),
        new SessionAttendancesRepository(db),
        paymentQueueRepo,
        auditRepo,
        new FinancialAccountsRepository(db),
        new FinanceBillingPlansRepository(db)
    );
};

function createPipelineFailureLogger(auditRepo: SystemAuditRepository, phase: "text" | "audio") {
    return async (_phase: string, vocabularyId: string, error: unknown) => {
        const errMsg = error instanceof Error ? error.message : String(error);
        await auditRepo.insert({
            id: generateAuditId(),
            organizationId: PLATFORM_ORGANIZATION_ID,
            eventType: "vocabulary.pipeline_failed",
            severity: "warning",
            actorType: "system",
            subjectType: "vocabulary_bank",
            subjectId: vocabularyId,
            message: `Vocabulary ${phase} pipeline failed: ${errMsg}`,
            metadata: JSON.stringify({ phase, vocabularyId }),
        });
    };
}

export const createVocabularyTextProcessorFromEnv = (
    env: CloudflareBindings,
    systemPrompt: string
): VocabularyProcessingService => {
    const vocabularyRepo = getVocabularyBankRepositoryFromEnv(env);
    const auditRepo = getSystemAuditRepositoryFromEnv(env);
    const aiService = createAiServiceFromEnv(env, { systemPrompt });
    const ttsService = {
        generateAndUpload: async () => {
            throw new InternalServerError("TTS is not available in text processing");
        },
    } as unknown as TtsService;

    return new VocabularyProcessingService(vocabularyRepo, aiService, ttsService, {
        logPipelineFailure: createPipelineFailureLogger(auditRepo, "text"),
    });
};

export const createVocabularyAudioProcessorFromEnv = (
    env: CloudflareBindings
): VocabularyProcessingService | null => {
    const envBindings = env as unknown as Record<string, unknown>;
    if (
        !envBindings.GCP_CLIENT_EMAIL ||
        !envBindings.GCP_PRIVATE_KEY ||
        !envBindings.GCP_PROJECT_ID
    ) {
        return null;
    }

    const vocabularyRepo = getVocabularyBankRepositoryFromEnv(env);
    const uploadRepo = getUploadRepositoryFromEnv(env);
    const auditRepo = getSystemAuditRepositoryFromEnv(env);
    const aiService = createAiServiceFromEnv(env, {
        systemPrompt: VOCABULARY_TRANSLATION_INSTRUCTIONS,
    });
    const credentials = parseGoogleTtsCredentials(env as unknown as Record<string, unknown>);
    const ttsService = new TtsService(credentials, getBucketClientFromEnv(env));

    return new VocabularyProcessingService(
        vocabularyRepo,
        aiService,
        ttsService,
        {
            logPipelineFailure: createPipelineFailureLogger(auditRepo, "audio"),
        },
        uploadRepo
    );
};
