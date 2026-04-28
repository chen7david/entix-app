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
    financialTransactions,
    lessons,
    scheduledSessions,
    sessionAttendances,
} from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { drainQueue } from "../../api/tests/helpers/queue-test.helper";
import { createAuthenticatedOrg, createOrgMemberWithRole } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Session Billing Integration", () => {
    let client: TestClient;
    let orgId: string;
    let db: any;

    beforeEach(async () => {
        db = await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        client = createTestClient(app, env, cookie);
        orgId = id;
    });

    it("should deduct correct amount using Closest Lower Tier logic", async () => {
        const planId = generateBillingPlanId();
        await db.insert(financeBillingPlans).values({
            id: planId,
            organizationId: orgId,
            name: "Tiered Standard",
            currencyId: FINANCIAL_CURRENCIES.CNY,
            isActive: true,
        });

        // Tiers for 1 and 5 participants
        await db.insert(financeBillingPlanRates).values([
            {
                id: generateBillingPlanRateId(),
                billingPlanId: planId,
                participantCount: 1,
                rateCentsPerMinute: 100, // Used for 1-4 students
            },
            {
                id: generateBillingPlanRateId(),
                billingPlanId: planId,
                participantCount: 5,
                rateCentsPerMinute: 80, // Used for 5+ students
            },
        ]);

        const student1 = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "student",
            email: "s1@test.com",
        });
        const student2 = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "student",
            email: "s2@test.com",
        });

        await db.insert(financeMemberBillingPlans).values([
            {
                id: generateMemberBillingPlanId(),
                userId: student1.userId,
                organizationId: orgId,
                billingPlanId: planId,
                currencyId: FINANCIAL_CURRENCIES.CNY,
            },
            {
                id: generateMemberBillingPlanId(),
                userId: student2.userId,
                organizationId: orgId,
                billingPlanId: planId,
                currencyId: FINANCIAL_CURRENCIES.CNY,
            },
        ]);

        // Setup Wallets & Treasury
        await db.insert(financialAccounts).values([
            {
                id: "facc_s1",
                organizationId: orgId,
                name: "S1 Wallet",
                currencyId: FINANCIAL_CURRENCIES.CNY,
                ownerType: "user",
                ownerId: student1.userId,
                accountType: "savings",
                balanceCents: 10000,
                isActive: true,
            },
            {
                id: "facc_s2",
                organizationId: orgId,
                name: "S2 Wallet",
                currencyId: FINANCIAL_CURRENCIES.CNY,
                ownerType: "user",
                ownerId: student2.userId,
                accountType: "savings",
                balanceCents: 10000,
                isActive: true,
            },
            {
                id: "facc_org_treasury",
                organizationId: orgId,
                name: "Org Funding",
                currencyId: FINANCIAL_CURRENCIES.CNY,
                ownerType: "org",
                ownerId: orgId,
                accountType: "funding",
                balanceCents: 0,
                isActive: true,
            },
        ]);

        const sessionId = "sess_01";
        await db.insert(lessons).values({
            id: "lesson_sess_01",
            organizationId: orgId,
            title: "Math Lesson",
        });
        await db.insert(scheduledSessions).values({
            id: sessionId,
            organizationId: orgId,
            lessonId: "lesson_sess_01",
            teacherId: student1.userId,
            title: "Math Class",
            startTime: new Date(),
            durationMinutes: 60,
            status: "scheduled",
        });

        // 2 students present. Should match the 1-student tier (100 cents/min)
        // because 2 >= 1 but 2 < 5.
        await db.insert(sessionAttendances).values([
            { sessionId, userId: student1.userId, organizationId: orgId, absent: false },
            { sessionId, userId: student2.userId, organizationId: orgId, absent: false },
        ]);

        const response = await client.orgs.schedule.updateStatus(orgId, sessionId, {
            status: "completed",
        });
        await drainQueue(env as unknown as CloudflareBindings);
        expect(response.status).toBe(HttpStatusCodes.OK);

        const txs = await db
            .select()
            .from(financialTransactions)
            .where(eq(financialTransactions.organizationId, orgId));

        // Expected: 100 cents * 60 min = 6000 cents per student
        for (const tx of txs) {
            expect(tx.amountCents).toBe(6000);
            expect(tx.description).toContain("100 cents/min");
            expect(tx.description).toContain("2 students");
        }
    });

    it("should deduct correct amount matching a higher tier (5+ students)", async () => {
        const planId = generateBillingPlanId();
        await db.insert(financeBillingPlans).values({
            id: planId,
            organizationId: orgId,
            name: "High Tier Plan",
            currencyId: FINANCIAL_CURRENCIES.CNY,
            isActive: true,
        });

        await db.insert(financeBillingPlanRates).values([
            {
                id: generateBillingPlanRateId(),
                billingPlanId: planId,
                participantCount: 1,
                rateCentsPerMinute: 100,
            },
            {
                id: generateBillingPlanRateId(),
                billingPlanId: planId,
                participantCount: 5,
                rateCentsPerMinute: 80,
            },
        ]);

        // Create 5 students
        const students = await Promise.all([
            createOrgMemberWithRole({ app, env, orgId, role: "student", email: "s5_1@test.com" }),
            createOrgMemberWithRole({ app, env, orgId, role: "student", email: "s5_2@test.com" }),
            createOrgMemberWithRole({ app, env, orgId, role: "student", email: "s5_3@test.com" }),
            createOrgMemberWithRole({ app, env, orgId, role: "student", email: "s5_4@test.com" }),
            createOrgMemberWithRole({ app, env, orgId, role: "student", email: "s5_5@test.com" }),
        ]);

        for (const s of students) {
            await db.insert(financeMemberBillingPlans).values({
                id: generateMemberBillingPlanId(),
                userId: s.userId,
                organizationId: orgId,
                billingPlanId: planId,
                currencyId: FINANCIAL_CURRENCIES.CNY,
            });
            await db.insert(financialAccounts).values({
                id: `facc_${s.userId}`,
                organizationId: orgId,
                name: "Wallet",
                currencyId: FINANCIAL_CURRENCIES.CNY,
                ownerType: "user",
                ownerId: s.userId,
                accountType: "savings",
                balanceCents: 10000,
                isActive: true,
            });
        }

        // Create Treasury once
        await db.insert(financialAccounts).values({
            id: `facc_org_treasury_${orgId}`,
            organizationId: orgId,
            name: "Org Funding",
            currencyId: FINANCIAL_CURRENCIES.CNY,
            ownerType: "org",
            ownerId: orgId,
            accountType: "funding",
            balanceCents: 0,
            isActive: true,
        });

        const sessionId = "sess_high_tier";
        await db.insert(lessons).values({
            id: "lesson_high_tier",
            organizationId: orgId,
            title: "Group Lesson",
        });
        await db.insert(scheduledSessions).values({
            id: sessionId,
            organizationId: orgId,
            lessonId: "lesson_high_tier",
            teacherId: students[0].userId,
            title: "Group Class",
            startTime: new Date(),
            durationMinutes: 60,
            status: "scheduled",
        });

        await db.insert(sessionAttendances).values(
            students.map((s) => ({
                sessionId,
                userId: s.userId,
                organizationId: orgId,
                absent: false,
            }))
        );

        const response = await client.orgs.schedule.updateStatus(orgId, sessionId, {
            status: "completed",
        });
        await drainQueue(env as unknown as CloudflareBindings);
        expect(response.status).toBe(HttpStatusCodes.OK);

        const txs = await db
            .select()
            .from(financialTransactions)
            .where(eq(financialTransactions.organizationId, orgId));
        const sessionTxs = txs.filter((tx: any) => tx.description.includes("Group Class"));

        // Expected: 80 cents * 60 min = 4800 cents per student
        expect(sessionTxs.length).toBe(5);
        for (const tx of sessionTxs) {
            expect(tx.amountCents).toBe(4800);
            expect(tx.description).toContain("80 cents/min");
            expect(tx.description).toContain("5 students");
        }
    });

    it("should throw NotFoundError if headcount is below the lowest tier", async () => {
        const planId = generateBillingPlanId();
        await db.insert(financeBillingPlans).values({
            id: planId,
            organizationId: orgId,
            name: "High Tier Only",
            currencyId: FINANCIAL_CURRENCIES.CNY,
            isActive: true,
        });

        // Only configured for 5+ students
        await db.insert(financeBillingPlanRates).values([
            {
                id: generateBillingPlanRateId(),
                billingPlanId: planId,
                participantCount: 5,
                rateCentsPerMinute: 80,
            },
        ]);

        const student1 = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "student",
            email: "s3@test.com",
        });

        await db.insert(financeMemberBillingPlans).values({
            id: generateMemberBillingPlanId(),
            userId: student1.userId,
            organizationId: orgId,
            billingPlanId: planId,
            currencyId: FINANCIAL_CURRENCIES.CNY,
        });

        const sessionId = "sess_02";
        await db.insert(lessons).values({
            id: "lesson_sess_02",
            organizationId: orgId,
            title: "Solo Lesson",
        });
        await db.insert(scheduledSessions).values({
            id: sessionId,
            organizationId: orgId,
            lessonId: "lesson_sess_02",
            teacherId: student1.userId,
            title: "Solo Class",
            startTime: new Date(),
            durationMinutes: 60,
        });
        await db.insert(sessionAttendances).values({
            sessionId,
            userId: student1.userId,
            organizationId: orgId,
            absent: false,
        });

        // 1 student present. Plan lowest tier is 5. Should fail.
        const response = await client.orgs.schedule.updateStatus(orgId, sessionId, {
            status: "completed",
        });
        // We do not drainQueue if the endpoint itself returns a 4xx error and doesn't enqueue.
        expect(response.status).toBe(HttpStatusCodes.NOT_FOUND);
        const body = (await response.json()) as any;
        expect(body.error).toContain("has no tier for session size: 1");
        expect(body.error).toContain("Minimum required: 5");
    });

    it("should preserve assignedAt and allow silent replacement (Upsert)", async () => {
        const currency = FINANCIAL_CURRENCIES.CNY;
        const student = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "student",
            email: "student-upsert@test.com",
        });

        const plan1Id = generateBillingPlanId();
        const plan2Id = generateBillingPlanId();
        await db.insert(financeBillingPlans).values([
            { id: plan1Id, organizationId: orgId, name: "Plan A", currencyId: currency },
            { id: plan2Id, organizationId: orgId, name: "Plan B", currencyId: currency },
        ]);

        // 1. Initial Assignment
        const assignRes = await client.orgs.finance.assignBillingPlan(orgId, student.userId, {
            planId: plan1Id,
        });
        expect(assignRes.status).toBe(HttpStatusCodes.CREATED);
        const initial = (await assignRes.json()) as any;
        const initialAssignedAt = initial.data.assignedAt;

        // Wait a bit to ensure timestamp would be different if updated
        await new Promise((resolve) => setTimeout(resolve, 10));

        // 2. Replace with Plan B (using assign endpoint which now handles upsert)
        const replaceRes = await client.orgs.finance.assignBillingPlan(orgId, student.userId, {
            planId: plan2Id,
        });
        expect(replaceRes.status).toBe(HttpStatusCodes.CREATED); // Returns CREATED for successful upsert
        const updated = (await replaceRes.json()) as any;

        expect(updated.data.billingPlanId).toBe(plan2Id);
        expect(updated.data.assignedAt).toBe(initialAssignedAt); // MUST be preserved
    });

    it("should return 404 for unauthorized unassignment (Fintech Security)", async () => {
        const studentA = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "student",
            email: "a@test.com",
        });
        const studentB = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "student",
            email: "b@test.com",
        });

        const planId = generateBillingPlanId();
        await db.insert(financeBillingPlans).values({
            id: planId,
            organizationId: orgId,
            name: "Plan",
            currencyId: FINANCIAL_CURRENCIES.CNY,
        });

        // Assign plan to Student A
        const assignmentId = generateMemberBillingPlanId();
        await db.insert(financeMemberBillingPlans).values({
            id: assignmentId,
            userId: studentA.userId,
            organizationId: orgId,
            billingPlanId: planId,
            currencyId: FINANCIAL_CURRENCIES.CNY,
        });

        // 1. Attempt to unassign Student A's plan using Student B's userId in route
        const response = await client.orgs.finance.unassignBillingPlan(
            orgId,
            studentB.userId,
            assignmentId
        );

        // Must return 404 to avoid leaking existence vs ownership
        expect(response.status).toBe(HttpStatusCodes.NOT_FOUND);
        const body = (await response.json()) as any;
        expect(body.error).toBe("Plan assignment not found");
    });

    it("should enforce ON DELETE RESTRICT on billing plans", async () => {
        const planId = generateBillingPlanId();
        await db.insert(financeBillingPlans).values({
            id: planId,
            organizationId: orgId,
            name: "Persistent Plan",
            currencyId: FINANCIAL_CURRENCIES.CNY,
        });

        const student = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "student",
            email: "restrict-test@test.com",
        });
        const assignmentId = generateMemberBillingPlanId();
        await db.insert(financeMemberBillingPlans).values({
            id: assignmentId,
            userId: student.userId,
            organizationId: orgId,
            billingPlanId: planId,
            currencyId: FINANCIAL_CURRENCIES.CNY,
        });

        // 1. Try to delete the plan when assigned - should fail at DB level
        // (Note: We'll check the error code or generic failure if the service doesn't wrap it yet)
        await expect(
            db.delete(financeBillingPlans).where(eq(financeBillingPlans.id, planId))
        ).rejects.toThrow();

        // 2. Unassign student
        await db
            .delete(financeMemberBillingPlans)
            .where(eq(financeMemberBillingPlans.id, assignmentId));

        // 3. Try to delete again - should succeed
        await expect(
            db.delete(financeBillingPlans).where(eq(financeBillingPlans.id, planId))
        ).resolves.toBeDefined();
    });
});
