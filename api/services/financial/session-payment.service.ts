import { BadRequestError, ConflictError } from "@api/errors/app.error";
import type { DbBatchRunner } from "@api/helpers/batch-runner";
import type { FinanceBillingPlansRepository } from "@api/repositories/financial/finance-billing-plans.repository";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import {
    type FinancialTransactionsRepository,
    LEDGER_BATCH_INDEX,
} from "@api/repositories/financial/financial-transactions.repository";
import type { PaymentQueueRepository } from "@api/repositories/payment/payment-queue.repository";
import type { SessionAttendancesRepository } from "@api/repositories/session-attendances.repository";
import type { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import {
    FINANCIAL_CATEGORIES,
    FINANCIAL_CURRENCIES,
    getSystemAdjustmentAccountId,
} from "@shared/constants/financial";
import {
    createTransactionRepoInputSchema,
    financialAccounts,
    financialTransactions,
    type PaymentRequest,
} from "@shared/db/schema";
import { resolveOverdraftLimit } from "@shared/utils/billing";
import { IdempotencyKeys } from "@shared/utils/idempotency-keys";
import { sql } from "drizzle-orm";
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
        private readonly paymentRequestsRepo: PaymentQueueRepository,
        private readonly auditRepo: SystemAuditRepository,
        private readonly accountsRepo: FinancialAccountsRepository,
        private readonly billingPlansRepo: FinanceBillingPlansRepository
    ) {
        super();
    }

    /**
     * Processes a session payment using a two-phase batch strategy.
     *
     * @deprecated Use `PaymentQueueService.enqueue()` and the asynchronous queue consumer instead.
     * This method remains for synchronous internal needs.
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
    }): Promise<{ transactionId: string; paymentRequestId: string; auditId: string }> {
        const idempotencyKey = IdempotencyKeys.sessionPayment(input.sessionId, input.userId);

        const existing = await this.paymentRequestsRepo.findByIdempotencyKey(idempotencyKey);
        if (existing?.status === "completed") {
            throw new ConflictError(
                `Payment already processed for session ${input.sessionId} and user ${input.userId}.`
            );
        }

        const paymentRequestId = `pr_${nanoid()}`;
        const record = await this.paymentRequestsRepo.insert({
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
            userId: input.userId,
            note: input.note ?? null,

            attemptCount: 1,
            lastAttemptedAt: new Date(),
        });

        const { txId, auditId } = await this.processFromRequest(record);

        await this.paymentRequestsRepo.updateStatus(paymentRequestId, "completed", {
            transactionId: txId,
            processedAt: new Date(),
        });

        return { transactionId: txId, paymentRequestId, auditId };
    }

    /**
     * Core payment execution logic invoked by the asynchronous queue consumer.
     * Handles ledger writes and application-level status updates for a pre-recorded request.
     *
     * @param pr - The payment request record to process.
     * @returns The generated transaction ID on success.
     */
    async processFromRequest(pr: PaymentRequest): Promise<{ txId: string; auditId: string }> {
        if (pr.type !== "session_payment") {
            throw new Error(`Invalid payment request type for session processing: ${pr.type}`);
        }

        const userId = pr.userId;
        if (!userId) {
            throw new Error(`Attribution userId missing for payment request ${pr.id}`);
        }

        const [sourceAccount, memberPlan] = await Promise.all([
            this.accountsRepo.findById(pr.sourceAccountId),
            this.billingPlansRepo
                .getMemberPlanByCurrency(userId, pr.organizationId, pr.currencyId)
                .catch(() => null),
        ]);

        const resolvedOverdraft = resolveOverdraftLimit(
            { overdraftLimitCents: sourceAccount?.overdraftLimitCents ?? null },
            memberPlan?.plan ?? null
        );

        const now = new Date();
        const txId = `tx_${nanoid()}`;
        const debitLineId = `txl_${nanoid()}`;
        const creditLineId = `txl_${nanoid()}`;

        const txInput = createTransactionRepoInputSchema.parse({
            id: txId,
            organizationId: pr.organizationId,
            categoryId: pr.categoryId,
            sourceAccountId: pr.sourceAccountId,
            destinationAccountId: pr.destinationAccountId,
            currencyId: pr.currencyId,
            amountCents: pr.amountCents,
            transactionDate: now,
            createdAt: now,
            debitLineId,
            creditLineId,
            description: pr.note ?? `Payment for session ${pr.referenceId}`,
            idempotencyKey: pr.idempotencyKey,
        });

        // 1. Prepare Financial Ledger Statements
        const overdraftExpr =
            resolvedOverdraft !== null
                ? sql`${resolvedOverdraft}`
                : sql`COALESCE(${financialAccounts.overdraftLimitCents}, 0)`;

        const balanceGuard = sql`${financialAccounts.id} = ${pr.sourceAccountId} AND ${financialAccounts.isActive} IS NOT 0 AND ${financialAccounts.balanceCents} + ${overdraftExpr} >= ${pr.amountCents}`;

        const ledgerStatements = this.transactionsRepo.prepareStatements(txInput, balanceGuard);
        const transactionExistsGuard = sql`EXISTS (SELECT 1 FROM ${financialTransactions} WHERE ${financialTransactions.id} = ${txId})`;

        // 2. Prepare Application Writes (Attendance + Audit)
        const attendanceStatement = this.attendancesRepo.prepareUpdatePaymentStatus(
            pr.referenceId,
            userId,
            "paid",
            transactionExistsGuard
        );

        const auditId = `aud_${nanoid()}`;
        const auditStatement = this.auditRepo.prepareGuardedInsert(
            {
                id: auditId,
                organizationId: pr.organizationId,
                eventType: "session_payment_processed",
                severity: "info",
                actorId: pr.requestedBy ?? null,
                actorType: pr.requestedBy ? "user" : "system",
                subjectType: "session_attendance",
                subjectId: `${pr.referenceId}:${userId}`,
                message: `Processed session payment for session ${pr.referenceId}`,
                metadata: JSON.stringify({
                    amountCents: pr.amountCents,
                    transactionId: txId,
                    paymentRequestId: pr.id,
                }),
                createdAt: now,
            },
            transactionExistsGuard
        );

        // 3. Execute Unified Atomic Batch
        // Keep debit last so guards evaluate pre-debit state.
        const [
            creditStatement,
            headerStatement,
            debitLineStatement,
            creditLineStatement,
            debitStatement,
        ] = ledgerStatements;

        let results: any[];
        try {
            results = await this.dbBatchRunner.batch([
                creditStatement,
                headerStatement,
                debitLineStatement,
                creditLineStatement,
                attendanceStatement,
                auditStatement,
                debitStatement,
            ]);
        } catch (err: unknown) {
            const batchError = err instanceof Error ? err.message : String(err);
            console.error("[SessionPaymentService] Batch Error Detail:", batchError);
            throw new Error(`DB_BATCH_FAILURE: ${batchError}`);
        }

        // 4. Verify ledger success.
        const debitResult = results[LEDGER_BATCH_INDEX.debit + 2] as any;

        if (!debitResult.meta?.rows_written || debitResult.meta.rows_written === 0) {
            throw new BadRequestError("Payment failed: Insufficient funds or inactive account.");
        }

        return { txId, auditId };
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
        const idempotencyKey = `manual_override:${input.sessionId}:${input.userId}`;

        const existing = await this.paymentRequestsRepo.findByIdempotencyKey(idempotencyKey);
        if (existing) {
            throw new ConflictError(
                "A manual override already exists for this session-user pair. Multiple manual overrides are prohibited."
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
            currencyId: FINANCIAL_CURRENCIES.ETD,
            sourceAccountId: getSystemAdjustmentAccountId(FINANCIAL_CURRENCIES.ETD),
            destinationAccountId: getSystemAdjustmentAccountId(FINANCIAL_CURRENCIES.ETD),
            categoryId: FINANCIAL_CATEGORIES.SYSTEM_ADJUSTMENT,
            idempotencyKey,
            referenceType: "session",
            referenceId: input.sessionId,
            requestedBy: input.performedBy,
            userId: input.userId,
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
