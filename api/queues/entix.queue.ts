import app from "@api/app";
import { BadRequestError, InternalServerError } from "@api/errors/app.error";
import { DbBatchRunner } from "@api/helpers/batch-runner";
import { FinanceBillingPlansRepository } from "@api/repositories/financial/finance-billing-plans.repository";
import { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import { PaymentQueueRepository } from "@api/repositories/payment/payment-queue.repository";
import { SessionAttendancesRepository } from "@api/repositories/session-attendances.repository";
import { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import { VocabularyBankRepository } from "@api/repositories/vocabulary-bank.repository";
import { AiService } from "@api/services/ai.service";
import { SessionPaymentService } from "@api/services/financial/session-payment.service";
import { VocabularyProcessingService } from "@api/services/vocabulary-processing.service";
import { generateAuditId, PLATFORM_ORGANIZATION_ID } from "@shared";
import * as schema from "@shared/db/schema";
import { drizzle } from "drizzle-orm/d1";

// ─── Message Type Union ───────────────────────────────────────────────────────

export type EntixQueueMessage =
    | {
          type: "billing.retry-missed-payment";
          eventId: string;
          organizationId: string;
      }
    | {
          type: "billing.process-payment";
          paymentRequestId: string;
      }
    | {
          type: "vocabulary.process-text";
          vocabularyId: string;
      }
    | {
          type: "vocabulary.process-audio";
          vocabularyId: string;
      };

// ─── Handler ─────────────────────────────────────────────────────────────────

export const EntixQueueHandler = {
    async process(
        message: Message<EntixQueueMessage>,
        env: CloudflareBindings,
        executionCtx: ExecutionContext
    ): Promise<void> {
        const body = message.body;

        switch (body.type) {
            case "billing.retry-missed-payment":
                return handleBillingRetry(
                    message as Message<
                        Extract<EntixQueueMessage, { type: "billing.retry-missed-payment" }>
                    >,
                    env
                );

            case "billing.process-payment":
                return handleBillingProcess(
                    message as Message<
                        Extract<EntixQueueMessage, { type: "billing.process-payment" }>
                    >,
                    env,
                    executionCtx
                );
            case "vocabulary.process-text":
                return handleVocabularyProcessText(
                    message as Message<
                        Extract<EntixQueueMessage, { type: "vocabulary.process-text" }>
                    >,
                    env
                );
            case "vocabulary.process-audio":
                return handleVocabularyProcessAudio(
                    message as Message<
                        Extract<EntixQueueMessage, { type: "vocabulary.process-audio" }>
                    >,
                    env
                );

            default: {
                const _exhaustive: never = body as never;
                console.error(`[Queue] Unknown message type:`, _exhaustive);
                message.ack();
            }
        }
    },
};

// ─── Billing Process ─────────────────────────────────────────────────────────

async function handleBillingProcess(
    message: Message<Extract<EntixQueueMessage, { type: "billing.process-payment" }>>,
    env: CloudflareBindings,
    _executionCtx: ExecutionContext
): Promise<void> {
    const { paymentRequestId } = message.body;

    // Explicit dependency instantiation (No AppContext cast)
    const db = drizzle(env.DB, { schema });
    const paymentQueueRepo = new PaymentQueueRepository(db);
    const auditRepo = new SystemAuditRepository(db);
    const sessionPaymentService = new SessionPaymentService(
        new DbBatchRunner(db),
        new FinancialTransactionsRepository(db),
        new SessionAttendancesRepository(db),
        paymentQueueRepo,
        auditRepo,
        new FinancialAccountsRepository(db),
        new FinanceBillingPlansRepository(db)
    );

    try {
        const pr = await paymentQueueRepo.findById(paymentRequestId);

        // Guard: only process pending requests
        if (!pr || pr.status !== "pending") {
            message.ack();
            return;
        }

        // 1. Mark as processing
        await paymentQueueRepo.updateStatus(pr.id, "processing", {
            lastAttemptedAt: new Date(),
            attemptCount: (pr.attemptCount ?? 0) + 1,
        });

        // 2. Dispatch to dedicated business logic
        const { txId } = await processPaymentRequest(pr, sessionPaymentService);

        // 3. Mark as completed
        await paymentQueueRepo.updateStatus(pr.id, "completed", {
            transactionId: txId,
            processedAt: new Date(),
        });

        console.log(`[Queue:Payment] Succeeded: ${pr.id} -> tx: ${txId}`);
        message.ack();
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[Queue:Payment] Failed: ${paymentRequestId}:`, errMsg);

        // Update record with failure reason to assist cron reconciliation
        const pr = await paymentQueueRepo.updateStatus(paymentRequestId, "failed", {
            failureReason: errMsg,
        });

        // Restore audit write for business failures (insufficient funds, etc.)
        if (err instanceof BadRequestError || (err as any).status === 400) {
            // Standalone audit row after payment failure — explicit id keeps logging independent of optional FK wiring.
            await auditRepo.insert({
                id: generateAuditId(),
                organizationId: pr.organizationId,
                eventType: "payment.failed",
                severity: "warning",
                subjectType: "session_attendance",
                subjectId: `${pr.referenceId}:${pr.userId}`,
                message: errMsg,
                metadata: JSON.stringify({ paymentRequestId: pr.id }),
            });
            // Business failure — don't retry an impossible payment
            message.ack();
            return;
        }

        // Infrastructure failure — retry is appropriate
        message.retry();
    }
}

async function handleVocabularyProcessText(
    message: Message<Extract<EntixQueueMessage, { type: "vocabulary.process-text" }>>,
    env: CloudflareBindings
): Promise<void> {
    const db = drizzle(env.DB, { schema });
    const vocabularyRepo = new VocabularyBankRepository(db);
    const auditRepo = new SystemAuditRepository(db);
    const aiService = new AiService({
        ai: env.AI,
        model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    });
    const processor = new VocabularyProcessingService(vocabularyRepo, aiService, env.QUEUE, {
        logPipelineFailure: async (_phase, vocabularyId, error) => {
            const errMsg = error instanceof Error ? error.message : String(error);
            await auditRepo.insert({
                id: generateAuditId(),
                organizationId: PLATFORM_ORGANIZATION_ID,
                eventType: "vocabulary.pipeline_failed",
                severity: "warning",
                actorType: "system",
                subjectType: "vocabulary_bank",
                subjectId: vocabularyId,
                message: `Vocabulary text pipeline failed: ${errMsg}`,
                metadata: JSON.stringify({ phase: "text", vocabularyId }),
            });
        },
    });

    try {
        await processor.processText(message.body.vocabularyId);
        message.ack();
    } catch (error) {
        console.error("[Queue:VocabularyText] Unhandled failure:", error);
        message.retry();
    }
}

async function handleVocabularyProcessAudio(
    message: Message<Extract<EntixQueueMessage, { type: "vocabulary.process-audio" }>>,
    env: CloudflareBindings
): Promise<void> {
    const db = drizzle(env.DB, { schema });
    const vocabularyRepo = new VocabularyBankRepository(db);
    const auditRepo = new SystemAuditRepository(db);
    const aiService = new AiService({
        ai: env.AI,
        model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    });
    const processor = new VocabularyProcessingService(vocabularyRepo, aiService, env.QUEUE, {
        logPipelineFailure: async (_phase, vocabularyId, error) => {
            const errMsg = error instanceof Error ? error.message : String(error);
            await auditRepo.insert({
                id: generateAuditId(),
                organizationId: PLATFORM_ORGANIZATION_ID,
                eventType: "vocabulary.pipeline_failed",
                severity: "warning",
                actorType: "system",
                subjectType: "vocabulary_bank",
                subjectId: vocabularyId,
                message: `Vocabulary audio pipeline failed: ${errMsg}`,
                metadata: JSON.stringify({ phase: "audio", vocabularyId }),
            });
        },
    });

    try {
        await processor.processAudio(message.body.vocabularyId);
        message.ack();
    } catch (error) {
        console.error("[Queue:VocabularyAudio] Unhandled failure:", error);
        message.retry();
    }
}

async function processPaymentRequest(
    pr: schema.PaymentRequest,
    sessionPaymentService: SessionPaymentService
): Promise<{ txId: string; auditId: string }> {
    switch (pr.type) {
        case "session_payment":
            return sessionPaymentService.processFromRequest(pr);
        default:
            throw new InternalServerError(
                `[Queue:Payment] Unsupported request type: ${pr.type as string}`
            );
    }
}

// ─── Billing Retry (Legacy/Audit-based) ───────────────────────────────────────

async function handleBillingRetry(
    message: Message<Extract<EntixQueueMessage, { type: "billing.retry-missed-payment" }>>,
    env: CloudflareBindings
): Promise<void> {
    const { eventId, organizationId } = message.body;

    try {
        const response = await app.request(
            "/api/v1/internal/billing/retry-missed-payment",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Internal-Secret": env.INTERNAL_SECRET,
                },
                body: JSON.stringify({ eventId, organizationId }),
            },
            env
        );

        if (!response.ok) {
            console.error(`[Queue:BillingRetry] HTTP error for ${eventId}: ${response.statusText}`);
            message.retry();
            return;
        }

        const result = (await response.json()) as { status: string; message: string };

        if (result.status === "failed") {
            // Permanent business failure — log to audit trail and ack to prevent infinite loop
            console.warn(
                `[Queue:BillingRetry] Permanent failure for ${eventId}: ${result.message}`
            );
            await writePermanentFailureAuditEvent(
                { eventId, organizationId, reason: result.message },
                env
            );
            message.ack();
        } else {
            console.log(`[Queue:BillingRetry] Reconciled ${eventId}`);
            message.ack();
        }
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[Queue:BillingRetry] Unhandled error for ${eventId}:`, errMsg);
        message.retry();
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function writePermanentFailureAuditEvent(
    {
        eventId,
        organizationId,
        reason,
    }: { eventId: string; organizationId: string; reason: string },
    env: CloudflareBindings
): Promise<void> {
    try {
        const db = drizzle(env.DB, { schema });
        const auditRepo = new SystemAuditRepository(db);
        await auditRepo.insert({
            id: generateAuditId(), // isolated insert; explicit id for clarity in queue failure path
            eventType: "payment.reconciliation-failed",
            severity: "critical",
            subjectType: "payment_event",
            subjectId: eventId,
            organizationId,
            message: `Queue reconciliation permanently failed: ${reason}`,
            metadata: JSON.stringify({ eventId, organizationId, reason }),
        });
    } catch (err) {
        // Never let an audit write failure crash the queue handler
        console.error(`[Queue:BillingRetry] Failed to write audit event for ${eventId}:`, err);
    }
}
