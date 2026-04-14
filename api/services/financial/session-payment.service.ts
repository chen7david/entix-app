import { BadRequestError, ConflictError } from "@api/errors/app.error";
import type { AppDb, BatchRunner } from "@api/factories/db.factory";
import type { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import type { SessionAttendancesRepository } from "@api/repositories/session-attendances.repository";
import type { SessionPaymentEventsRepository } from "@api/repositories/session-payment-events.repository";
import type { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import { createTransactionRepoInputSchema, financialSessionPaymentEvents } from "@shared/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { BaseService } from "../base.service";

/**
 * SessionPaymentService orchestrates the financial, attendance, and audit flow
 * for session-based payments using a two-phase batch strategy.
 */
export class SessionPaymentService extends BaseService {
    constructor(
        private readonly db: AppDb,
        private readonly batchRunner: BatchRunner,
        private readonly transactionsRepo: FinancialTransactionsRepository,
        private readonly attendancesRepo: SessionAttendancesRepository,
        private readonly paymentEventsRepo: SessionPaymentEventsRepository,
        private readonly auditRepo: SystemAuditRepository
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
    }): Promise<{ transactionId: string; eventId: string; auditId: string }> {
        const now = new Date();
        const txId = `tx_${nanoid()}`;
        const debitLineId = `txl_${nanoid()}`;
        const creditLineId = `txl_${nanoid()}`;
        const eventId = `spe_${nanoid()}`;
        const auditId = `aud_${nanoid()}`;

        // Phase 1: Financial Ledger
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
        const [debitResult] = await this.batchRunner.batch([
            txStatements[0], // debit source only
        ] as Parameters<typeof this.batchRunner.batch>[0]);

        if (debitResult.meta.rows_written === 0) {
            throw new BadRequestError(
                "Transaction failed: Insufficient funds or inactive account."
            );
        }

        // Phase 1b: Ledger records (Credit + Header + Lines)
        await this.batchRunner.batch([
            txStatements[1], // credit destination
            txStatements[2], // transaction header
            txStatements[3], // debit line
            txStatements[4], // credit line
        ] as Parameters<typeof this.batchRunner.batch>[0]);

        // Phase 2: Application-level writes
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

        await this.batchRunner.batch([
            eventStatement,
            attendanceStatement,
            auditStatement,
        ] as Parameters<typeof this.batchRunner.batch>[0]);

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
        const existingManualEvent = await this.db.query.financialSessionPaymentEvents.findFirst({
            where: and(
                eq(financialSessionPaymentEvents.sessionId, input.sessionId),
                eq(financialSessionPaymentEvents.userId, input.userId),
                isNull(financialSessionPaymentEvents.transactionId)
            ),
        });

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

        await this.batchRunner.batch([eventStatement, attendanceStatement] as Parameters<
            typeof this.batchRunner.batch
        >[0]);

        return { eventId };
    }

    /**
     * Utility to fetch the full payment history for a specific student in a session.
     */
    async getSessionEvents(sessionId: string, userId: string) {
        return this.paymentEventsRepo.listByUserInSession(sessionId, userId);
    }
}
