import { ConflictError } from "@api/errors/app.error";
import { DbBatchRunner } from "@api/helpers/batch-runner";
import { FinanceBillingPlansRepository } from "@api/repositories/financial/finance-billing-plans.repository";
import { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import { PaymentQueueRepository } from "@api/repositories/payment/payment-queue.repository";
import { SessionAttendancesRepository } from "@api/repositories/session-attendances.repository";
import { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import { SessionPaymentService } from "@api/services/financial/session-payment.service";
import { FINANCIAL_CATEGORIES, FINANCIAL_CURRENCIES } from "@shared";
import {
    authOrganizations,
    authUsers,
    financialAccounts,
    lessons,
    paymentRequests,
    scheduledSessions,
    sessionAttendances,
    systemAuditEvents,
} from "@shared/db/schema";
import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { TestDb } from "../../lib/utils";
import { createTestDb } from "../../lib/utils";

describe("SessionPaymentService Integration", () => {
    let db: TestDb;
    let service: SessionPaymentService;

    const orgId = "org_svc_test";
    const studentId = "student_svc_test";
    const sessionId = "sess_svc_test";
    const lessonId = "lesson_svc_test";
    const currencyId = FINANCIAL_CURRENCIES.USD;
    const manualOverrideCurrencyId = FINANCIAL_CURRENCIES.ETD;
    const categoryId = FINANCIAL_CATEGORIES.CASH_DEPOSIT;

    let studentAccountId: string;
    let orgAccountId: string;

    beforeEach(async () => {
        db = await createTestDb();

        service = new SessionPaymentService(
            new DbBatchRunner(db),
            new FinancialTransactionsRepository(db),
            new SessionAttendancesRepository(db),
            new PaymentQueueRepository(db),
            new SystemAuditRepository(db),
            new FinancialAccountsRepository(db),
            new FinanceBillingPlansRepository(db)
        );

        // Setup seed data
        await db
            .insert(authOrganizations)
            .values({ id: orgId, name: "Svc Org", slug: "svc-org", createdAt: new Date() })
            .onConflictDoNothing();
        await db
            .insert(authUsers)
            .values({
                id: studentId,
                name: "Student User",
                email: "student@svc.test",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .onConflictDoNothing();
        await db
            .insert(lessons)
            .values({
                id: lessonId,
                organizationId: orgId,
                title: "Svc Lesson",
            })
            .onConflictDoNothing();
        await db
            .insert(scheduledSessions)
            .values({
                id: sessionId,
                organizationId: orgId,
                lessonId,
                teacherId: studentId,
                title: "Svc Session",
                startTime: new Date(),
                durationMinutes: 60,
            })
            .onConflictDoNothing();
        await db
            .insert(sessionAttendances)
            .values({
                sessionId,
                organizationId: orgId,
                userId: studentId,
                paymentStatus: "unpaid",
            })
            .onConflictDoNothing();

        studentAccountId = `acc_student_${studentId}`;
        orgAccountId = `acc_org_${orgId}`;

        await db
            .insert(financialAccounts)
            .values({
                id: studentAccountId,
                ownerId: studentId,
                ownerType: "user",
                organizationId: orgId,
                currencyId,
                name: "Student Savings",
                balanceCents: 5000,
                isActive: true,
                accountType: "savings",
            })
            .onConflictDoNothing();

        await db
            .insert(financialAccounts)
            .values({
                id: orgAccountId,
                ownerId: orgId,
                ownerType: "org",
                organizationId: orgId,
                currencyId,
                name: "Org Funding",
                balanceCents: 0,
                isActive: true,
                accountType: "funding",
            })
            .onConflictDoNothing();

        await db
            .insert(financialAccounts)
            .values({
                id: `facc_system_adjustment_${manualOverrideCurrencyId}`,
                ownerId: "system",
                ownerType: "org",
                organizationId: null,
                currencyId: manualOverrideCurrencyId,
                name: "System Adjustment",
                balanceCents: 0,
                isActive: true,
                accountType: "system",
            })
            .onConflictDoNothing();
    });

    it("should process payment atomically (Happy Path)", async () => {
        const amountCents = 1500;

        const result = await service.processSessionPayment({
            organizationId: orgId,
            sessionId,
            userId: studentId,
            amountCents,
            currencyId,
            sourceAccountId: studentAccountId,
            destinationAccountId: orgAccountId,
            categoryId,
            performedBy: studentId,
        });

        expect(result.transactionId).toBeDefined();

        // Verify Student Balance debited
        const studentAcc = await db.query.financialAccounts.findFirst({
            where: eq(financialAccounts.id, studentAccountId),
        });
        expect(studentAcc?.balanceCents).toBe(3500);

        // Verify Org Balance credited
        const orgAcc = await db.query.financialAccounts.findFirst({
            where: eq(financialAccounts.id, orgAccountId),
        });
        expect(orgAcc?.balanceCents).toBe(1500);

        // Verify Attendance Status flipped to paid
        const attendance = await db.query.sessionAttendances.findFirst({
            where: and(
                eq(sessionAttendances.sessionId, sessionId),
                eq(sessionAttendances.userId, studentId)
            ),
        });
        expect(attendance?.paymentStatus).toBe("paid");

        // Verify Payment Event logged via payment_requests
        const request = await db.query.paymentRequests.findFirst({
            where: eq(paymentRequests.referenceId, sessionId),
        });
        expect(request).toBeDefined();
        expect(request?.amountCents).toBe(amountCents);
        expect(request?.status).toBe("completed");

        // Verify Audit Log created
        const audit = await db.query.systemAuditEvents.findFirst({
            where: eq(systemAuditEvents.organizationId, orgId),
        });
        expect(audit).toBeDefined();
        expect(audit?.eventType).toBe("session_payment_processed");
    });

    it("should rollback all writes when balance is insufficient (Rollback Test)", async () => {
        // Attempting to debit more than the student's 5000 cent balance.
        // The debit guard in prepareStatements() uses gte(balance, amount),
        // so rows_written === 0 → BadRequestError thrown by the service.
        await expect(
            service.processSessionPayment({
                organizationId: orgId,
                sessionId,
                userId: studentId,
                amountCents: 10000, // exceeds the student's 5000 balance
                currencyId,
                sourceAccountId: studentAccountId,
                destinationAccountId: orgAccountId,
                categoryId,
                performedBy: studentId,
            })
        ).rejects.toThrow(/Insufficient funds/i);

        // Student balance must be unchanged
        const studentAcc = await db.query.financialAccounts.findFirst({
            where: eq(financialAccounts.id, studentAccountId),
        });
        expect(studentAcc?.balanceCents).toBe(5000);

        // Attendance status must remain unpaid
        const attendance = await db.query.sessionAttendances.findFirst({
            where: and(
                eq(sessionAttendances.sessionId, sessionId),
                eq(sessionAttendances.userId, studentId)
            ),
        });
        expect(attendance?.paymentStatus).toBe("unpaid");
    });

    /**
     * KNOWN ARCHITECTURAL LIMITATION — Two-Phase Batch on D1
     *
     * D1 `batch()` is NOT a SQL transaction. Each statement commits immediately.
     * Our two-phase design guards against Phase 1 (debit) failure, but if Phase 2
     * (event insert, attendance update, audit insert) encounters an error AFTER
     * Phase 1 has already committed, the financial ledger will be debited without
     * a corresponding attendance update or audit log — leaving the system in a
     * partially-committed state.
     *
     * Mitigation: Use compensating writes (a reconciliation job or a manual_reset
     * payment event) to correct such states. This is the accepted trade-off for
     * stateless edge workers on D1 which do not support true ACID transactions
     * across batch statements.
     *
     * This test documents that Phase 2 failure does NOT roll back Phase 1.
     */
    it("should NOT rollback Phase 1 if Phase 2 fails (known D1 limitation)", async () => {
        // PROXY TEST — simulates the class of Phase 2 failure using a silent-miss scenario.
        //
        // The truest Phase 2 "hard failure" would be a DB constraint violation AFTER
        // Phase 1 commits (e.g. a duplicate financialSessionPaymentEvents id), which
        // would cause db.batch() for Phase 2 to throw — but at that point the debit is
        // already on-disk and cannot be rolled back.
        //
        // We simulate the same observable outcome (Phase 1 committed, Phase 2 incomplete)
        // by omitting the session_attendance row, so the attendance UPDATE targets zero rows
        // silently. Both scenarios leave the ledger debited without a matching attendance
        // update — which is the invariant this test guards.
        //
        // This test is NOT expected to throw.

        const isolatedOrgId = "org_phase2_limit";
        const isolatedUserId = "user_phase2_limit";
        const isolatedSessionId = "sess_phase2_limit";
        const isolatedLessonId = "lesson_phase2_limit";
        const isolatedStudentAccountId = "acc_student_phase2";
        const isolatedOrgAccountId = "acc_org_phase2";

        await db.insert(authOrganizations).values({
            id: isolatedOrgId,
            name: "Phase2 Org",
            slug: "phase2-org",
            createdAt: new Date(),
        });
        await db.insert(authUsers).values({
            id: isolatedUserId,
            name: "Phase2 User",
            email: "phase2@svc.test",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await db.insert(lessons).values({
            id: isolatedLessonId,
            organizationId: isolatedOrgId,
            title: "Phase2 Lesson",
        });
        await db.insert(scheduledSessions).values({
            id: isolatedSessionId,
            organizationId: isolatedOrgId,
            lessonId: isolatedLessonId,
            teacherId: isolatedUserId,
            title: "Phase2 Session",
            startTime: new Date(),
            durationMinutes: 60,
        });
        // NOTE: session_attendance row intentionally NOT inserted.

        await db.insert(financialAccounts).values({
            id: isolatedStudentAccountId,
            ownerId: isolatedUserId,
            ownerType: "user",
            organizationId: isolatedOrgId,
            currencyId,
            name: "Student Savings",
            balanceCents: 5000,
            isActive: true,
            accountType: "savings",
        });
        await db.insert(financialAccounts).values({
            id: isolatedOrgAccountId,
            ownerId: isolatedOrgId,
            ownerType: "org",
            organizationId: isolatedOrgId,
            currencyId,
            name: "Org Funding",
            balanceCents: 0,
            isActive: true,
            accountType: "funding",
        });

        // Phase 1 will succeed (debit is valid). Phase 2 attendance update will
        // silently touch 0 rows (no attendance record exists). The service
        // does not detect Phase 2 silent failures — see architecture note above.
        await service.processSessionPayment({
            organizationId: isolatedOrgId,
            sessionId: isolatedSessionId,
            userId: isolatedUserId,
            amountCents: 1000,
            currencyId,
            sourceAccountId: isolatedStudentAccountId,
            destinationAccountId: isolatedOrgAccountId,
            categoryId,
            performedBy: isolatedUserId,
        });

        // Phase 1 DID commit — balance is debited
        const acc = await db.query.financialAccounts.findFirst({
            where: eq(financialAccounts.id, isolatedStudentAccountId),
        });
        expect(acc?.balanceCents).toBe(4000); // 5000 - 1000

        // Phase 2 attendance update targeted zero rows (no attendance row existed)
        const attendance = await db.query.sessionAttendances.findFirst({
            where: and(
                eq(sessionAttendances.sessionId, isolatedSessionId),
                eq(sessionAttendances.userId, isolatedUserId)
            ),
        });
        expect(attendance).toBeUndefined(); // No attendance row was ever created
    });

    it("should allow creating a 'system' account without an organizationId", async () => {
        const systemAccId = "acc_system_no_org";
        await db.insert(financialAccounts).values({
            id: systemAccId,
            ownerId: "system",
            ownerType: "org",
            organizationId: null, // Proved by the new CHECK constraint
            currencyId,
            name: "Global Fee Collection",
            balanceCents: 0,
            isActive: true,
            accountType: "system",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const entry = await db.query.financialAccounts.findFirst({
            where: eq(financialAccounts.id, systemAccId),
        });
        expect(entry).toBeDefined();
        expect(entry?.organizationId).toBeNull();
    });

    it("should prevent duplicate manual overrides for the same session-user pair", async () => {
        const payload = {
            organizationId: orgId,
            sessionId,
            userId: studentId,
            eventType: "manual_paid" as const,
            performedBy: studentId,
            note: "First manual override",
        };

        // First call succeeded
        await service.manualOverride(payload);

        // Second call should throw ConflictError
        await expect(
            service.manualOverride({
                ...payload,
                eventType: "manual_reset",
                note: "Sneaky second override",
            })
        ).rejects.toThrow(ConflictError);

        // Verify only ONE manual record exists
        const requests = await service.getSessionPaymentRequests(sessionId);
        const manualEvents = requests.filter((r) => r.type === "manual_payment");
        expect(manualEvents).toHaveLength(1);
    });
});
