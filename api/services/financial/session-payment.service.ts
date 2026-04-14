import { ConflictError } from "@api/errors/app.error";
import type { DbBatchRunner } from "@api/helpers/batch-runner";
import type { FinanceBillingPlansRepository } from "@api/repositories/financial/finance-billing-plans.repository";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import type { PaymentRequestsRepository } from "@api/repositories/payment-requests.repository";
import type { SessionAttendancesRepository } from "@api/repositories/session-attendances.repository";
import type { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import { createTransactionRepoInputSchema } from "@shared/db/schema";
import { resolveOverdraftLimit } from "@shared/utils/billing";
import { nanoid } from "nanoid";
import { BaseService } from "../base.service";

/**
 * SessionPaymentService orchestrates the financial, attendance, and audit flow
 * for session-based payments using a two-phase batch strategy.
 */
export class SessionPaymentService extends BaseService {
    constructor(
        private readonly dbBatchRunner: DbBatchRunner,
        private readonly transactionsRepo: FinancialTransactionsRepository,
        private readonly attendancesRepo: SessionAttendancesRepository,
        private readonly paymentRequestsRepo: PaymentRequestsRepository,
        private readonly auditRepo: SystemAuditRepository,
        private readonly accountsRepo: FinancialAccountsRepository,
        private readonly billingPlansRepo: FinanceBillingPlansRepository
    ) {
        super();
    }

    /**
     * Processes a session payment using a two-phase batch strategy.
     *
     * Idempotency: callers should supply a stable idempotency key in the format
     * `session_payment:{sessionId}:{userId}` to prevent double-charging.
     */
    async processSessionPayment(input: {
        organizationId: string;
        sessionId: string;
        userId: string;
        amountCents: number;
        currencyId: string;
        sourceAccountId: string;
        destinationAccountId: string;
        categoryId: string;
        performedBy: string | null;
        note?: string;
        overdraftOverrideCents?: number;
    }): Promise<{ transactionId: string; paymentRequestId: string; auditId: string }> {
        const idempotencyKey = `session_payment:${input.sessionId}:${input.userId}`;

        // Guard: reject if a completed payment request already exists for this key.
        const existing = await this.paymentRequestsRepo.findByIdempotencyKey(idempotencyKey);
        if (existing?.status === "completed") {
            throw new ConflictError(
                `Payment already processed for session ${input.sessionId} and user ${input.userId}.`
            );
        }

        const [sourceAccount, memberPlan] = await Promise.all([
            this.accountsRepo.findById(input.sourceAccountId),
            this.billingPlansRepo
                .getMemberPlanByCurrency(input.userId, input.organizationId, input.currencyId)
                .catch(() => null),
        ]);

        const resolvedOverdraft =
            input.overdraftOverrideCents ??
            resolveOverdraftLimit(
                { overdraftLimitCents: sourceAccount?.overdraftLimitCents ?? null },
                memberPlan?.plan ?? null
            );

        const now = new Date();
        const txId = `tx_${nanoid()}`;
        const debitLineId = `txl_${nanoid()}`;
        const creditLineId = `txl_${nanoid()}`;
        const paymentRequestId = `pr_${nanoid()}`;
        const auditId = `aud_${nanoid()}`;

        // Create the payment request record (intent-first).
        await this.paymentRequestsRepo.insert({
            id: paymentRequestId,
            organizationId: input.organizationId,
            type: "session_payment",
            status: "processing",
            amountCents: input.amountCents,
            currencyId: input.currencyId,
            sourceAccountId: input.sourceAccountId,
            destinationAccountId: input.destinationAccountId,
            categoryId: input.categoryId,
            idempotencyKey,
            referenceType: "session",
            referenceId: input.sessionId,
            requestedBy: input.performedBy ?? null,
            note: input.note ?? null,
            attemptCount: 1,
            lastAttemptedAt: now,
            createdAt: now,
            updatedAt: now,
        });

        const txInput = createTransactionRepoInputSchema.parse({
            id: txId,
            organizationId: input.organizationId,
            categoryId: input.categoryId,
            sourceAccountId: input.sourceAccountId,
            destinationAccountId: input.destinationAccountId,
            currencyId: input.currencyId,
            amountCents: input.amountCents,
            transactionDate: now,
            createdAt: now,
            debitLineId,
            creditLineId,
            description: input.note ?? `Payment for session ${input.sessionId}`,
        });

        // Phase 1 + 2: Financial Ledger (Debit + Credit + Header + Lines)
        await this.transactionsRepo.insert(txInput, resolvedOverdraft);

        // Phase 3: Application-level writes — attendance status + audit log
        const attendanceStatement = this.attendancesRepo.prepareUpdatePaymentStatus(
            input.sessionId,
            input.userId,
            "paid"
        );

        const auditStatement = this.auditRepo.prepareInsert({
            id: auditId,
            organizationId: input.organizationId,
            eventType: "session_payment_processed",
            severity: "info",
            actorId: input.performedBy ?? null,
            actorType: input.performedBy ? "user" : "system",
            subjectType: "session_attendance",
            subjectId: `${input.sessionId}:${input.userId}`,
            message: `Processed session payment for session ${input.sessionId}`,
            metadata: JSON.stringify({
                amountCents: input.amountCents,
                transactionId: txId,
                paymentRequestId,
            }),
            createdAt: now,
        });

        await this.dbBatchRunner.batch([attendanceStatement, auditStatement]);

        // Mark the payment request as completed.
        await this.paymentRequestsRepo.updateStatus(paymentRequestId, "completed", {
            transactionId: txId,
            processedAt: now,
        });

        return { transactionId: txId, paymentRequestId, auditId };
    }

    /**
     * Records a manual payment override (manual_paid or manual_reset).
     * POLICY: Only one manual override is permitted per user/session pair.
     */
    async manualOverride(input: {
        organizationId: string;
        sessionId: string;
        userId: string;
        eventType: "manual_paid" | "manual_reset";
        performedBy: string;
        note: string;
    }) {
        const idempotencyKey = `${input.eventType}:${input.sessionId}:${input.userId}`;

        const existing = await this.paymentRequestsRepo.findByIdempotencyKey(idempotencyKey);
        if (existing) {
            throw new ConflictError(
                `A manual override (${input.eventType}) already exists for this session-user pair. Multiple manual overrides are prohibited.`
            );
        }

        const now = new Date();
        const paymentRequestId = `pr_${nanoid()}`;

        const paymentRequestStatement = this.paymentRequestsRepo.insert({
            id: paymentRequestId,
            organizationId: input.organizationId,
            type: "manual_payment",
            status: "completed",
            amountCents: 0,
            currencyId: "fcur_etd",
            sourceAccountId: `facc_system_adjustment_fcur_etd`,
            destinationAccountId: `facc_system_adjustment_fcur_etd`,
            categoryId: "fcat_system_adjustment",
            idempotencyKey,
            referenceType: "session",
            referenceId: input.sessionId,
            requestedBy: input.performedBy,
            note: input.note,
            attemptCount: 1,
            lastAttemptedAt: now,
            processedAt: now,
            createdAt: now,
            updatedAt: now,
        });

        const attendanceStatement = this.attendancesRepo.prepareUpdatePaymentStatus(
            input.sessionId,
            input.userId,
            input.eventType === "manual_paid" ? "paid" : "unpaid"
        );

        await this.dbBatchRunner.batch([attendanceStatement]);
        await paymentRequestStatement;

        return { paymentRequestId };
    }

    /**
     * Returns all payment requests for a given session reference.
     */
    async getSessionPaymentRequests(sessionId: string) {
        return this.paymentRequestsRepo.listByReference("session", sessionId);
    }
}
