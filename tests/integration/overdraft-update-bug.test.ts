import { env } from "cloudflare:test";
import app from "@api/app";
import { DbBatchRunner } from "@api/helpers/batch-runner";
import { FinanceBillingPlansRepository } from "@api/repositories/financial/finance-billing-plans.repository";
import { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import { PaymentQueueRepository } from "@api/repositories/payment/payment-queue.repository";
import { SessionAttendancesRepository } from "@api/repositories/session-attendances.repository";
import { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import { SessionPaymentService } from "@api/services/financial/session-payment.service";
import {
    FINANCIAL_CATEGORIES,
    FINANCIAL_CURRENCIES,
    generateAccountId,
    generateBillingPlanId,
    generateBillingPlanRateId,
    generateMemberBillingPlanId,
    generateOpaqueId,
} from "@shared";
import {
    financeBillingPlanRates,
    financeBillingPlans,
    financeMemberBillingPlans,
    financialAccounts,
    scheduledSessions,
    sessionAttendances,
} from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { drainQueue } from "../../api/tests/helpers/queue-test.helper";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestDb } from "../lib/utils";

describe("Hierarchical Overdraft Resolution", () => {
    let orgId: string;
    let userId: string;
    let db: ReturnType<typeof createTestDb> extends Promise<infer T> ? T : never;

    beforeEach(async () => {
        db = await createTestDb();
        const { orgId: oid, orgData } = await createAuthenticatedOrg({ app, env });
        orgId = oid;
        userId = orgData.data.user.id;
    });

    it("should persist overdraftLimitCents when updating a billing plan", async () => {
        const planId = "plan_bug_repro";
        await db.insert(financeBillingPlans).values({
            id: planId,
            organizationId: orgId,
            name: "Test Plan",
            currencyId: FINANCIAL_CURRENCIES.CNY,
            overdraftLimitCents: 0,
            isActive: true,
        });
        await db.insert(financeBillingPlanRates).values({
            id: "rate_bug_repro",
            billingPlanId: planId,
            participantCount: 1,
            rateCentsPerMinute: 100,
        });

        const { FinanceBillingPlansRepository } = await import(
            "@api/repositories/financial/finance-billing-plans.repository"
        );
        const repo = new FinanceBillingPlansRepository(db);

        await repo.updatePlan(planId, {
            overdraftLimitCents: 5000,
        });

        const updatedPlan = await db.query.financeBillingPlans.findFirst({
            where: eq(financeBillingPlans.id, planId),
        });

        expect(updatedPlan?.overdraftLimitCents).toBe(5000);
    });

    it("should succeed when account overdraft is NULL but billing plan has sufficient overdraft", async () => {
        const planId = generateBillingPlanId();
        const accId = generateAccountId();
        const destId = generateAccountId();
        const sessId = generateOpaqueId();

        // 1. Create a plan with 500 overdraft
        await db.insert(financeBillingPlans).values({
            id: planId,
            organizationId: orgId,
            name: "Overdraft Plan",
            currencyId: FINANCIAL_CURRENCIES.CNY,
            overdraftLimitCents: 500,
            isActive: true,
        });
        await db.insert(financeBillingPlanRates).values({
            id: generateBillingPlanRateId(),
            billingPlanId: planId,
            participantCount: 1,
            rateCentsPerMinute: 300,
        });

        // 2. Create student account with NULL overdraft
        await db.insert(financialAccounts).values({
            id: accId,
            organizationId: orgId,
            name: "Student Wallet",
            ownerId: userId,
            ownerType: "user",
            currencyId: FINANCIAL_CURRENCIES.CNY,
            balanceCents: 0,
            overdraftLimitCents: null, // Inherit from plan
            isActive: true,
        });

        // 3. Create destination account
        await db.insert(financialAccounts).values({
            id: destId,
            organizationId: orgId,
            name: "Org Funding",
            ownerId: orgId,
            ownerType: "org",
            currencyId: FINANCIAL_CURRENCIES.CNY,
            balanceCents: 0,
            isActive: true,
        });

        // 4. Assign plan to member
        await db.insert(financeMemberBillingPlans).values({
            id: generateMemberBillingPlanId(),
            userId,
            organizationId: orgId,
            billingPlanId: planId,
            currencyId: FINANCIAL_CURRENCIES.CNY,
            assignedAt: new Date(),
        });

        // 5. Create the session (required for attendance FK)
        await db.insert(scheduledSessions).values({
            id: sessId,
            organizationId: orgId,
            title: "Test Session",
            startTime: new Date(),
            durationMinutes: 60,
        });

        // 6. Setup attendance
        await db.insert(sessionAttendances).values({
            sessionId: sessId,
            userId,
            organizationId: orgId,
            paymentStatus: "unpaid",
        });

        // 7. Attempt to charge 300 cents
        const service = new SessionPaymentService(
            new DbBatchRunner(db),
            new FinancialTransactionsRepository(db),
            new SessionAttendancesRepository(db),
            new PaymentQueueRepository(db),
            new SystemAuditRepository(db),
            new FinancialAccountsRepository(db),
            new FinanceBillingPlansRepository(db)
        );

        await service.processSessionPayment({
            organizationId: orgId,
            sessionId: sessId,
            userId,
            amountCents: 300,
            currencyId: FINANCIAL_CURRENCIES.CNY,
            sourceAccountId: accId,
            destinationAccountId: destId,
            categoryId: FINANCIAL_CATEGORIES.CASH_DEPOSIT,
            performedBy: null,
        });

        // DRAIN QUEUE: Process the async payment request
        await drainQueue(env as unknown as CloudflareBindings);

        // 8. Assert success (balance -300)
        const updatedAcc = await db.query.financialAccounts.findFirst({
            where: eq(financialAccounts.id, accId),
        });
        expect(updatedAcc?.balanceCents).toBe(-300);
    });
});
