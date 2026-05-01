import { env } from "cloudflare:test";
import app from "@api/app";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import {
    FINANCIAL_CURRENCIES,
    generateBillingPlanId,
    generateBillingPlanRateId,
    generateMemberBillingPlanId,
} from "@shared";
import {
    financeBillingPlanRates,
    financeBillingPlans,
    financeMemberBillingPlans,
    financialAccounts,
    financialTransactionLines,
    financialTransactions,
    lessons,
    paymentRequests,
    scheduledSessions,
    sessionAttendances,
} from "@shared/db/schema";
import { desc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { drainQueue } from "../../api/tests/helpers/queue-test.helper";
import { createAuthenticatedOrg, createOrgMemberWithRole } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Ghost Transaction Prevention", () => {
    let client: TestClient;
    let orgId: string;
    let db: any;

    beforeEach(async () => {
        db = await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        client = createTestClient(app, env, cookie);
        orgId = id;

        await db.insert(financialAccounts).values({
            id: "facc_org_funding",
            organizationId: orgId,
            name: "Org Funding",
            currencyId: FINANCIAL_CURRENCIES.CNY,
            ownerType: "org",
            ownerId: orgId,
            accountType: "funding",
            balanceCents: 0,
            isActive: true,
        });
    });

    it("should write zero transactions and zero lines when debit fails due to insufficient funds", async () => {
        // Student with 0 balance, 0 overdraft — charge will fail
        const student = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "student",
            email: "ghost@test.com",
        });

        await db.insert(financialAccounts).values({
            id: "facc_ghost_student",
            organizationId: orgId,
            name: "Wallet",
            currencyId: FINANCIAL_CURRENCIES.CNY,
            ownerType: "user",
            ownerId: student.userId,
            accountType: "savings",
            balanceCents: 0,
            overdraftLimitCents: 0,
            isActive: true,
        });

        const planId = generateBillingPlanId();
        await db.insert(financeBillingPlans).values({
            id: planId,
            organizationId: orgId,
            name: "Standard Plan",
            currencyId: FINANCIAL_CURRENCIES.CNY,
            isActive: true,
        });
        await db.insert(financeBillingPlanRates).values({
            id: generateBillingPlanRateId(),
            billingPlanId: planId,
            participantCount: 1,
            rateCentsPerMinute: 100,
        });
        await db.insert(financeMemberBillingPlans).values({
            id: generateMemberBillingPlanId(),
            userId: student.userId,
            organizationId: orgId,
            billingPlanId: planId,
            currencyId: FINANCIAL_CURRENCIES.CNY,
        });

        await db.insert(lessons).values({
            id: "lesson_ghost",
            organizationId: orgId,
            title: "Ghost Lesson",
        });
        await db.insert(scheduledSessions).values({
            id: "sess_ghost",
            organizationId: orgId,
            lessonId: "lesson_ghost",
            teacherId: student.userId,
            title: "Ghost Test Session",
            startTime: new Date(),
            durationMinutes: 60,
            status: "scheduled",
        });
        await db.insert(sessionAttendances).values({
            sessionId: "sess_ghost",
            userId: student.userId,
            organizationId: orgId,
            absent: false,
        });

        // Complete the session — charge will fail (0 balance, 0 overdraft)
        const res = await client.orgs.schedule.updateStatus(orgId, "sess_ghost", {
            status: "completed",
        });
        expect(res.status).toBe(HttpStatusCodes.OK);

        // DRAIN QUEUE: Process the async payment request
        try {
            await drainQueue(env as unknown as CloudflareBindings);
        } catch (err) {
            const [pr] = await db
                .select()
                .from(paymentRequests)
                .orderBy(desc(paymentRequests.createdAt))
                .limit(1);
            throw new Error(`DRAIN_FAILURE(FAIL_CASE): ${pr?.failureReason} | ${err}`);
        }

        const [pr] = await db
            .select()
            .from(paymentRequests)
            .orderBy(desc(paymentRequests.createdAt))
            .limit(1);
        expect(pr.status).toBe("failed");
        expect(pr.failureReason).toBe("Payment failed: Insufficient funds or inactive account.");

        // ASSERTION 1: Zero transactions in financial_transactions
        const txs = await db
            .select()
            .from(financialTransactions)
            .where(eq(financialTransactions.organizationId, orgId));
        expect(txs.length).toBe(0); // ← FAILS before fix (ghost record exists)

        // ASSERTION 2: Zero transaction lines
        const lines = await db
            .select()
            .from(financialTransactionLines)
            .where(eq(financialTransactionLines.accountId, "facc_ghost_student"));
        expect(lines.length).toBe(0); // ← FAILS before fix (ghost lines exist)

        // ASSERTION 3: Source account balance unchanged
        const account = (
            await db
                .select()
                .from(financialAccounts)
                .where(eq(financialAccounts.id, "facc_ghost_student"))
        )[0];
        expect(account.balanceCents).toBe(0); // ← passes even before fix (debit WHERE guard works)

        // ASSERTION 4: Destination account balance unchanged
        const orgFunding = (
            await db
                .select()
                .from(financialAccounts)
                .where(eq(financialAccounts.id, "facc_org_funding"))
        )[0];
        expect(orgFunding.balanceCents).toBe(0); // ← FAILS before fix (phantom credit exists)
    });

    it("should write exactly one transaction and two lines when debit succeeds", async () => {
        // Student with sufficient balance — charge will succeed
        const student = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "student",
            email: "success@test.com",
        });

        await db.insert(financialAccounts).values({
            id: "facc_success_student",
            organizationId: orgId,
            name: "Wallet",
            currencyId: FINANCIAL_CURRENCIES.CNY,
            ownerType: "user",
            ownerId: student.userId,
            accountType: "savings",
            balanceCents: 10000,
            overdraftLimitCents: 0,
            isActive: true,
        });

        const planId = generateBillingPlanId();
        await db.insert(financeBillingPlans).values({
            id: planId,
            organizationId: orgId,
            name: "Standard Plan",
            currencyId: FINANCIAL_CURRENCIES.CNY,
            isActive: true,
        });
        await db.insert(financeBillingPlanRates).values({
            id: generateBillingPlanRateId(),
            billingPlanId: planId,
            participantCount: 1,
            rateCentsPerMinute: 100,
        });
        await db.insert(financeMemberBillingPlans).values({
            id: generateMemberBillingPlanId(),
            userId: student.userId,
            organizationId: orgId,
            billingPlanId: planId,
            currencyId: FINANCIAL_CURRENCIES.CNY,
        });

        await db.insert(lessons).values({
            id: "lesson_success",
            organizationId: orgId,
            title: "Success Lesson",
        });
        await db.insert(scheduledSessions).values({
            id: "sess_success",
            organizationId: orgId,
            lessonId: "lesson_success",
            teacherId: student.userId,
            title: "Success Test Session",
            startTime: new Date(),
            durationMinutes: 60,
            status: "scheduled",
        });
        await db.insert(sessionAttendances).values({
            sessionId: "sess_success",
            userId: student.userId,
            organizationId: orgId,
            absent: false,
        });

        const res = await client.orgs.schedule.updateStatus(orgId, "sess_success", {
            status: "completed",
        });
        try {
            await drainQueue(env as unknown as CloudflareBindings);
        } catch (err) {
            const [pr] = await db
                .select()
                .from(paymentRequests)
                .orderBy(desc(paymentRequests.createdAt))
                .limit(1);
            throw new Error(`DRAIN_FAILURE(SUCCESS_CASE): ${pr?.failureReason} | ${err}`);
        }
        expect(res.status).toBe(HttpStatusCodes.OK);

        // ASSERTION 1: Exactly one transaction record
        const txs = await db
            .select()
            .from(financialTransactions)
            .where(eq(financialTransactions.organizationId, orgId));
        expect(txs.length).toBe(1);
        expect(txs[0].amountCents).toBe(6000); // 100 cents/min * 60 min

        // ASSERTION 2: Exactly two lines (one debit, one credit)
        const lines = await db
            .select()
            .from(financialTransactionLines)
            .where(eq(financialTransactionLines.transactionId, txs[0].id));
        expect(lines.length).toBe(2);
        expect(lines.find((l: any) => l.direction === "debit")).toBeDefined();
        expect(lines.find((l: any) => l.direction === "credit")).toBeDefined();

        // ASSERTION 3: Source debited correctly
        const account = (
            await db
                .select()
                .from(financialAccounts)
                .where(eq(financialAccounts.id, "facc_success_student"))
        )[0];
        expect(account.balanceCents).toBe(4000); // 10000 - 6000

        // ASSERTION 4: Destination credited correctly
        const orgFunding = (
            await db
                .select()
                .from(financialAccounts)
                .where(eq(financialAccounts.id, "facc_org_funding"))
        )[0];
        expect(orgFunding.balanceCents).toBe(6000);
    });
});
