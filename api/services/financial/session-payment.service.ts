import { ConflictError } from "@api/errors/app.error";
import type { DbBatchRunner } from "@api/helpers/batch-runner";
import type { FinanceBillingPlansRepository } from "@api/repositories/financial/finance-billing-plans.repository";
import type { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import type { SessionAttendancesRepository } from "@api/repositories/session-attendances.repository";
import type { SessionPaymentEventsRepository } from "@api/repositories/session-payment-events.repository";
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
        private readonly paymentEventsRepo: SessionPaymentEventsRepository,
        private readonly auditRepo: SystemAuditRepository,
        private readonly accountsRepo: FinancialAccountsRepository,
        private readonly billingPlansRepo: FinanceBillingPlansRepository
    ) {
        super();
    }

    /**
     * Processes a session payment using a two-phase batch strategy.
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
    }): Promise<{ transactionId: string; eventId: string; auditId: string }> {
        const [sourceAccount, memberPlan] = await Promise.all([
            this.accountsRepo.findById(input.sourceAccountId),
            this.billingPlansRepo
                .getMemberPlanByCurrency(input.userId, input.organizationId, input.currencyId)
                .catch(() => null), // graceful fallback if no plan assigned
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
        const eventId = `spe_${nanoid()}`;
        const auditId = `aud_${nanoid()}`;

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
        // Handled atomically by the repository to ensure strict ledger integrity.
        await this.transactionsRepo.insert(txInput, resolvedOverdraft);

        // Phase 3: Application-level writes
        const eventStatement = this.paymentEventsRepo.prepareInsert({
            id: eventId,
            sessionId: input.sessionId,
            userId: input.userId,
            organizationId: input.organizationId,
            eventType: "paid",
            transactionId: txId,
            amountCents: input.amountCents,
            performedBy: input.performedBy ?? null,
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
            actorId: input.performedBy ?? null,
            actorType: input.performedBy ? "user" : "system",
            subjectType: "session_attendance",
            subjectId: `${input.sessionId}:${input.userId}`,
            message: `Processed session payment for session ${input.sessionId}`,
            metadata: JSON.stringify({
                amountCents: input.amountCents,
                transactionId: txId,
            }),
            createdAt: now,
        });

        await this.dbBatchRunner.batch([eventStatement, attendanceStatement, auditStatement]);

        return { transactionId: txId, eventId, auditId };
    }

    /**
     * Records a manual payment override (manual_paid or manual_reset).
     * POLICY: Only one manual override is permitted per user/session pair to avoid accounting drift.
     */
    async manualOverride(input: {
        organizationId: string;
        sessionId: string;
        userId: string;
        eventType: "manual_paid" | "manual_reset";
        performedBy: string;
        note: string;
    }) {
        // Blocker Fix: Guard against the manual_reset -> manual_paid loophole.
        // We check for ANY existing manual event (transactionId IS NULL) for this user/session.
        const existingManualEvent = await this.paymentEventsRepo.findExistingManualEvent(
            input.sessionId,
            input.userId
        );

        if (existingManualEvent) {
            throw new ConflictError(
                `A manual override (${existingManualEvent.eventType}) already exists for this session-user pair. Multiple manual overrides are prohibited.`
            );
        }

        const now = new Date();
        const eventId = `spe_${nanoid()}`;

        const eventStatement = this.paymentEventsRepo.prepareInsert({
            id: eventId,
            sessionId: input.sessionId,
            userId: input.userId,
            organizationId: input.organizationId,
            eventType: input.eventType,
            transactionId: null,
            amountCents: null,
            performedBy: input.performedBy,
            note: input.note,
            createdAt: now,
        });

        const attendanceStatement = this.attendancesRepo.prepareUpdatePaymentStatus(
            input.sessionId,
            input.userId,
            input.eventType === "manual_paid" ? "paid" : "unpaid"
        );

        await this.dbBatchRunner.batch([eventStatement, attendanceStatement]);

        return { eventId };
    }

    /**
     * Utility to fetch the full payment history for a specific student in a session.
     */
    async getSessionEvents(sessionId: string, userId: string) {
        return this.paymentEventsRepo.listByUserInSession(sessionId, userId);
    }
}
