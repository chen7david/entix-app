import { BadRequestError } from "@api/errors/app.error";
import type { BatchRunner } from "@api/factories/db.factory";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import type { SessionAttendancesRepository } from "@api/repositories/session-attendances.repository";
import type { SessionPaymentEventsRepository } from "@api/repositories/session-payment-events.repository";
import type { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import { createTransactionRepoInputSchema } from "@shared/db/schema";
import { nanoid } from "nanoid";
import { BaseService } from "../base.service";

/**
 * SessionPaymentService orchestrates the financial, attendance, and audit flow
 * for session-based payments using a two-phase batch strategy.
 */
export class SessionPaymentService extends BaseService {
    constructor(
        private readonly batchRunner: BatchRunner,
        private readonly transactionsRepo: FinancialTransactionsRepository,
        private readonly attendancesRepo: SessionAttendancesRepository,
        private readonly paymentEventsRepo: SessionPaymentEventsRepository,
        private readonly auditRepo: SystemAuditRepository
    ) {
        super();
    }

    /**
     * Processes a session payment using a two-phase batch strategy:
     *
     * Phase 1 — Financial Ledger (D1 batch):
     *   Atomically debits the source account and credits the destination account,
     *   inserts the transaction header and journal lines.
     *   D1 does NOT rollback on silent constraint failures, so we check
     *   `rows_written` on the debit result before proceeding.
     *
     * Phase 2 — Application Writes (D1 batch, conditional):
     *   Only executed if Phase 1 confirms the debit succeeded.
     *   Inserts the payment event log and updates the attendance status.
     *   System audit is appended last.
     *
     * This two-phase design ensures Phase 2 never fires on a failed debit.
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
        performedBy: string;
        note?: string;
    }): Promise<{ transactionId: string; eventId: string; auditId: string }> {
        const now = new Date();
        const txId = `tx_${nanoid()}`;
        const debitLineId = `txl_${nanoid()}`;
        const creditLineId = `txl_${nanoid()}`;
        const eventId = `spe_${nanoid()}`;
        const auditId = `aud_${nanoid()}`;

        // ── Phase 1: Double-entry financial transaction ──────────────────────
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

        const txStatements = this.transactionsRepo.prepareStatements(txInput);
        const [debitResult] = await this.batchRunner.batch(
            txStatements as Parameters<typeof this.batchRunner.batch>[0]
        );

        // Guard: debit returned 0 rows → balance check or isActive check failed.
        // Phase 2 must NOT run in this case.
        if (debitResult.meta.rows_written === 0) {
            throw new BadRequestError(
                "Transaction failed: Insufficient funds or inactive account."
            );
        }

        // ── Phase 2: Application-level writes (conditional on Phase 1 success) ─
        const eventStatement = this.paymentEventsRepo.prepareInsert({
            id: eventId,
            sessionId: input.sessionId,
            userId: input.userId,
            organizationId: input.organizationId,
            eventType: "paid",
            transactionId: txId,
            amountCents: input.amountCents,
            performedBy: input.performedBy,
            note: input.note,
            createdAt: now,
        });

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
            actorId: input.performedBy,
            actorType: "user",
            subjectType: "session_attendance",
            subjectId: `${input.sessionId}:${input.userId}`,
            message: `Processed session payment for session ${input.sessionId}`,
            metadata: JSON.stringify({
                amountCents: input.amountCents,
                transactionId: txId,
            }),
            createdAt: now,
        });

        await this.batchRunner.batch([
            eventStatement,
            attendanceStatement,
            auditStatement,
        ] as Parameters<typeof this.batchRunner.batch>[0]);

        return { transactionId: txId, eventId, auditId };
    }
}
