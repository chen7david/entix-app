import { env } from "cloudflare:test";
import app from "@api/app";
import { FINANCIAL_CURRENCIES } from "@shared";
import { financeBillingPlanRates, financeBillingPlans } from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestDb } from "../lib/utils";

describe("Billing Plan Overdraft Update Bug", () => {
    let orgId: string;
    let db: any;

    beforeEach(async () => {
        db = await createTestDb();
        const { orgId: id } = await createAuthenticatedOrg({ app, env });
        orgId = id;
    });

    it("should persist overdraftLimitCents when updating a billing plan", async () => {
        // 1. Create a plan with 0 overdraft
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

        // 2. Update repository directly
        const { FinanceBillingPlansRepository } = await import(
            "@api/repositories/financial/finance-billing-plans.repository"
        );
        const repo = new FinanceBillingPlansRepository(db);

        await repo.updatePlan(planId, {
            overdraftLimitCents: 5000,
        });

        // 3. Fetch and verify
        const updatedPlan = await db.query.financeBillingPlans.findFirst({
            where: eq(financeBillingPlans.id, planId),
        });

        expect(updatedPlan.overdraftLimitCents).toBe(5000);
    });
});
