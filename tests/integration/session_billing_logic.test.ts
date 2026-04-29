import { env } from "cloudflare:test";
import app from "@api/app";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import {
    FINANCIAL_CURRENCIES,
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
    financialTransactions,
    lessons,
    scheduledSessions,
    sessionAttendances,
    systemAuditEvents,
} from "@shared/db/schema";
import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { drainQueue } from "../../api/tests/helpers/queue-test.helper";
import { createAuthenticatedOrg, createOrgMemberWithRole } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Session Billing Logic Verification", () => {
    let client: TestClient;
    let orgId: string;
    let db: any;

    beforeEach(async () => {
        db = await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        client = createTestClient(app, env, cookie);
        orgId = id;

        // Setup Treasury/Funding globally for tests
        await db.insert(financialAccounts).values({
            id: `facc_org_funding`,
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

    const setupStudent = async (email: string, balance: number, overdraft: number | null) => {
        const s = await createOrgMemberWithRole({ app, env, orgId, role: "student", email });
        await db.insert(financialAccounts).values({
            id: `facc_${s.userId}`,
            organizationId: orgId,
            name: "Wallet",
            currencyId: FINANCIAL_CURRENCIES.CNY,
            ownerType: "user",
            ownerId: s.userId,
            accountType: "savings",
            balanceCents: balance,
            overdraftLimitCents: overdraft,
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
            userId: s.userId,
            organizationId: orgId,
            billingPlanId: planId,
            currencyId: FINANCIAL_CURRENCIES.CNY,
        });
        return s;
    };

    const runSession = async (student: any, duration: number) => {
        const sid = generateOpaqueId();
        const lessonId = generateOpaqueId();
        await db.insert(lessons).values({
            id: lessonId,
            organizationId: orgId,
            title: "Test Lesson",
        });
        await db.insert(scheduledSessions).values({
            id: sid,
            organizationId: orgId,
            lessonId,
            teacherId: student.userId,
            title: "Test Session",
            startTime: new Date(),
            durationMinutes: duration,
        });
        await db.insert(sessionAttendances).values({
            sessionId: sid,
            userId: student.userId,
            organizationId: orgId,
            absent: false,
        });
        const res = await client.orgs.schedule.updateStatus(orgId, sid, { status: "completed" });
        await drainQueue(env as unknown as CloudflareBindings);
        expect(res.status).toBe(HttpStatusCodes.OK);
        return sid;
    };

    const getAudit = async (sessionId: string, userId: string) => {
        return (
            await db
                .select()
                .from(systemAuditEvents)
                .where(
                    and(
                        eq(systemAuditEvents.organizationId, orgId),
                        eq(systemAuditEvents.subjectId, `${sessionId}:${userId}`),
                        eq(systemAuditEvents.eventType, "payment.failed")
                    )
                )
        )[0];
    };

    it("should be idempotent and not double charge", async () => {
        const student = await setupStudent("idempotent@test.com", 10000, 0);

        const sessionId = "sess_01";
        await db.insert(lessons).values({
            id: "lesson_sess_01",
            organizationId: orgId,
            title: "Session 01 Lesson",
        });
        await db.insert(scheduledSessions).values({
            id: sessionId,
            organizationId: orgId,
            lessonId: "lesson_sess_01",
            teacherId: student.userId,
            title: "Session 01",
            startTime: new Date(),
            durationMinutes: 60,
            status: "scheduled",
        });
        await db.insert(sessionAttendances).values({
            sessionId,
            userId: student.userId,
            organizationId: orgId,
            absent: false,
        });

        // 1. First completion
        let res = await client.orgs.schedule.updateStatus(orgId, sessionId, {
            status: "completed",
        });
        await drainQueue(env as unknown as CloudflareBindings);
        expect(res.status).toBe(HttpStatusCodes.OK);

        const attendance = (
            await db
                .select()
                .from(sessionAttendances)
                .where(eq(sessionAttendances.userId, student.userId))
        )[0];
        expect(attendance.paymentStatus).toBe("paid");

        let account = (
            await db
                .select()
                .from(financialAccounts)
                .where(eq(financialAccounts.ownerId, student.userId))
        )[0];
        const balanceAfter1 = account.balanceCents;
        expect(balanceAfter1).toBe(4000);

        // 2. Second completion (should be idempotent)
        res = await client.orgs.schedule.updateStatus(orgId, sessionId, { status: "completed" });
        await drainQueue(env as unknown as CloudflareBindings);
        expect(res.status).toBe(HttpStatusCodes.OK);

        account = (
            await db
                .select()
                .from(financialAccounts)
                .where(eq(financialAccounts.ownerId, student.userId))
        )[0];
        expect(account.balanceCents).toBe(balanceAfter1);

        const txs = await db
            .select()
            .from(financialTransactions)
            .where(eq(financialTransactions.organizationId, orgId));
        expect(txs.length).toBe(1);
    });

    it("should correctly block payments exceeding available balance plus overdraft", async () => {
        // 1. Blocked: (balance: 0, overdraft: 0), charge: 1000
        const s1 = await setupStudent("s1@test.com", 0, 0);
        const sid1 = await runSession(s1, 10);
        const audit1 = await getAudit(sid1, s1.userId);
        expect(audit1).toBeDefined();
        expect(audit1.message).toContain("Insufficient funds or inactive account");
        const acc1 = (
            await db
                .select()
                .from(financialAccounts)
                .where(eq(financialAccounts.ownerId, s1.userId))
        )[0];
        expect(acc1.balanceCents).toBe(0);

        // 2. Blocked: (balance: 0, overdraft: 5000), charge: 5100
        const s3 = await setupStudent("s3@test.com", 0, 5000);
        const sid3 = await runSession(s3, 51);
        const audit3 = await getAudit(sid3, s3.userId);
        expect(audit3).toBeDefined();
        expect(audit3.message).toContain("Insufficient funds or inactive account");
        const acc3 = (
            await db
                .select()
                .from(financialAccounts)
                .where(eq(financialAccounts.ownerId, s3.userId))
        )[0];
        expect(acc3.balanceCents).toBe(0);

        // 3. Blocked: (balance: 0, overdraft: null), charge: 100
        const s4 = await setupStudent("s4@test.com", 0, null);
        const sid4 = await runSession(s4, 1);
        const audit4 = await getAudit(sid4, s4.userId);
        expect(audit4).toBeDefined();
        expect(audit4.message).toContain("Insufficient funds or inactive account");
        const acc4 = (
            await db
                .select()
                .from(financialAccounts)
                .where(eq(financialAccounts.ownerId, s4.userId))
        )[0];
        expect(acc4.balanceCents).toBe(0);
    });

    it("should allow payments within combined balance and overdraft limit", async () => {
        // 1. Allowed: (balance: 0, overdraft: 5000), charge: 4000
        const s2 = await setupStudent("s2@test.com", 0, 5000);
        await runSession(s2, 40);
        const acc2 = (
            await db
                .select()
                .from(financialAccounts)
                .where(eq(financialAccounts.ownerId, s2.userId))
        )[0];
        expect(acc2.balanceCents).toBe(-4000);
    });
});
