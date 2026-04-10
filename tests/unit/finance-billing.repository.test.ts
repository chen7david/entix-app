import { FinanceBillingPlansRepository } from "@api/repositories/financial/finance-billing-plans.repository";
import { generateBillingPlanId, generateBillingPlanRateId } from "@shared";
import {
    authOrganizations,
    authUsers,
    financeBillingPlans,
    financeMemberBillingPlans,
} from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "../lib/utils";

describe("FinanceBillingPlansRepository Unit Test", () => {
    let db: TestDb;
    let repo: FinanceBillingPlansRepository;

    beforeEach(async () => {
        db = await createTestDb();
        repo = new FinanceBillingPlansRepository(db as any);

        // Seed test organization
        await db.insert(authOrganizations).values({
            id: "org_test",
            name: "Test Org",
            slug: "test-org",
            createdAt: new Date(),
        });
    });

    describe("createPlan (Batch)", () => {
        it("should create a plan and its rates atomically", async () => {
            const planId = generateBillingPlanId();
            const rates = [
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
            ];

            const plan = await repo.createPlan(
                {
                    id: planId,
                    organizationId: "org_test",
                    name: "Standard Plan",
                    currencyId: "fcur_etd",
                    isActive: true,
                },
                rates as any
            );

            expect(plan.id).toBe(planId);

            // Verify both tables were updated
            const dbPlan = await db.query.financeBillingPlans.findFirst({
                where: (table, { eq }) => eq(table.id, planId),
                with: { rates: true },
            });

            expect(dbPlan).toBeDefined();
            expect(dbPlan?.rates).toHaveLength(2);
            expect(dbPlan?.rates[0].rateCentsPerMinute).toBe(100);
        });
    });

    describe("upsertMemberPlan (Atomic)", () => {
        it("should atomically upsert assignments and preserve ID", async () => {
            const userId = "user_01";
            const oldPlanId = "fbp_old";
            const newPlanId = "fbp_new";

            // Seed user
            await db.insert(authUsers).values({
                id: userId,
                name: "Test User",
                email: "test@example.com",
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            // Seed plans
            await db.insert(financeBillingPlans).values([
                {
                    id: oldPlanId,
                    organizationId: "org_test",
                    name: "Old",
                    currencyId: "fcur_etd",
                    isActive: true,
                },
                {
                    id: newPlanId,
                    organizationId: "org_test",
                    name: "New",
                    currencyId: "fcur_etd",
                    isActive: true,
                },
            ]);

            // Seed initial state
            await db.insert(financeMemberBillingPlans).values({
                id: "fmbp_01",
                userId,
                organizationId: "org_test",
                billingPlanId: oldPlanId,
                currencyId: "fcur_etd",
            });

            await repo.upsertMemberPlan({
                id: "fmbp_02", // This ID should be IGNORED on conflict
                userId,
                organizationId: "org_test",
                billingPlanId: newPlanId,
                currencyId: "fcur_etd",
            });

            const assignments = await db
                .select()
                .from(financeMemberBillingPlans)
                .where(eq(financeMemberBillingPlans.userId, userId));
            expect(assignments).toHaveLength(1);
            expect(assignments[0].billingPlanId).toBe(newPlanId);
            expect(assignments[0].id).toBe("fmbp_01"); // MUST preserve the original record ID
        });
    });
});
