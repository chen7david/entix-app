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
    scheduledSessions,
    sessionAttendances,
} from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
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

    it("should deduct correct amount based on tiered rates and headcount", async () => {
        // 1. Setup Plan & Rates (API or DB)
        // We'll use DB directly for complex setup to avoid multiple API calls during prep
        const planId = generateBillingPlanId();
        await db.insert(financeBillingPlans).values({
            id: planId,
            organizationId: orgId,
            name: "Tiered Standard",
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
                participantCount: 2,
                rateCentsPerMinute: 80,
            },
        ]);

        // 2. Setup Student & Assignment
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

        // 3. Give students balance & Org Treasury
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
                name: "Org Treasury",
                currencyId: FINANCIAL_CURRENCIES.CNY,
                ownerType: "org",
                ownerId: orgId,
                accountType: "treasury",
                balanceCents: 0,
                isActive: true,
            },
        ]);

        // 4. Create Session
        const sessionId = "sess_01";
        await db.insert(scheduledSessions).values({
            id: sessionId,
            organizationId: orgId,
            title: "Math Class",
            startTime: new Date(),
            durationMinutes: 60,
            status: "scheduled",
        });

        // 5. Join students (2 present)
        await db.insert(sessionAttendances).values([
            { sessionId, userId: student1.userId, organizationId: orgId, absent: false },
            { sessionId, userId: student2.userId, organizationId: orgId, absent: false },
        ]);

        // 6. Complete Session via API
        const response = await client.orgs.schedule.updateStatus(orgId, sessionId, {
            status: "completed",
        });
        if (response.status !== 200) {
            const body = await response.json();
            throw new Error(
                `[DEBUG API FAIL] status=${response.status}, body=${JSON.stringify(body)}`
            );
        }
        expect(response.status).toBe(HttpStatusCodes.OK);

        // 7. Verify Deductions
        // Headcount was 2, so rate should be 80 cents/min.
        // Duration was 60 min.
        // Amount = 80 * 60 = 4800 cents.

        const txs = await db
            .select()
            .from(financialTransactions)
            .where(eq(financialTransactions.organizationId, orgId));
        expect(txs).toHaveLength(2); // One per present student

        for (const tx of txs) {
            expect(tx.amountCents).toBe(4800);
            expect(tx.description).toContain("80 cents/min");
            expect(tx.description).toContain("60 min");
            expect(tx.description).toContain("2 students");

            const metadata = tx.metadata as any;
            expect(metadata.rateCentsPerMinute).toBe(80);
            expect(metadata.participantCount).toBe(2);
            expect(metadata.durationMinutes).toBe(60);
        }
    });

    it("should throw NotFoundError if session size is unconfigured", async () => {
        const planId = generateBillingPlanId();
        await db.insert(financeBillingPlans).values({
            id: planId,
            organizationId: orgId,
            name: "Strict Plan",
            currencyId: FINANCIAL_CURRENCIES.CNY,
            isActive: true,
        });

        // Only configured for 1 student
        await db.insert(financeBillingPlanRates).values([
            {
                id: generateBillingPlanRateId(),
                billingPlanId: planId,
                participantCount: 1,
                rateCentsPerMinute: 100,
            },
        ]);

        const student1 = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "student",
            email: "s3@test.com",
        });
        const student2 = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "student",
            email: "s4@test.com",
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

        const sessionId = "sess_02";
        await db.insert(scheduledSessions).values({
            id: sessionId,
            organizationId: orgId,
            title: "Failure Class",
            startTime: new Date(),
            durationMinutes: 60,
        });
        await db.insert(sessionAttendances).values([
            { sessionId, userId: student1.userId, organizationId: orgId, absent: false },
            { sessionId, userId: student2.userId, organizationId: orgId, absent: false },
        ]);

        // Complete session - should fail because size 2 is not configured
        const response = await client.orgs.schedule.updateStatus(orgId, sessionId, {
            status: "completed",
        });
        expect(response.status).toBe(HttpStatusCodes.NOT_FOUND);
        const body = (await response.json()) as any;
        expect(body.error).toContain("is not configured for session size: 2");
    });
});
