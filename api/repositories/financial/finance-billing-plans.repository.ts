import { InternalServerError } from "@api/errors/app.error";
import type { AppDb } from "@api/factories/db.factory";
import {
    type BillingPlan,
    type BillingPlanRate,
    financeBillingPlanRates,
    financeBillingPlans,
    financeMemberBillingPlans,
    type MemberBillingPlan,
    type NewBillingPlan,
    type NewBillingPlanRate,
    type NewMemberBillingPlan,
} from "@shared/db/schema";
import { and, desc, eq, lt } from "drizzle-orm";

/**
 * Composite type for a member's plan assignment including tiered rates.
 */
export type MemberPlanWithRates = MemberBillingPlan & {
    plan:
        | (BillingPlan & {
              rates: BillingPlanRate[];
          })
        | null;
};

/**
 * Repository for Billing Plans and Student Assignments.
 */
export class FinanceBillingPlansRepository {
    constructor(private readonly db: AppDb) {}

    async findById(id: string) {
        const plan = await this.db.query.financeBillingPlans.findFirst({
            where: eq(financeBillingPlans.id, id),
            with: { rates: true },
        });
        return plan ?? null;
    }

    async findMemberPlanById(id: string): Promise<MemberBillingPlan | null> {
        const assignment = await this.db.query.financeMemberBillingPlans.findFirst({
            where: eq(financeMemberBillingPlans.id, id),
        });
        return assignment ?? null;
    }

    /**
     * Creates a new organization-level billing plan with its rates.
     */
    async createPlan(input: NewBillingPlan, rates: NewBillingPlanRate[]) {
        const [plan] = await this.db.batch([
            this.db.insert(financeBillingPlans).values(input).returning(),
            this.db.insert(financeBillingPlanRates).values(rates),
        ]);

        const createdPlan = plan[0];
        if (!createdPlan) throw new InternalServerError("Failed to create billing plan");
        return createdPlan;
    }

    /**
     * Atomically assigns or replaces a member's billing plan.
     * Note: On conflict (update path), the existing record's `id` and `assignedAt` are preserved.
     * The `id` passed in the `assignment` object is only used for new insertions.
     */
    async upsertMemberPlan(input: NewMemberBillingPlan): Promise<MemberBillingPlan> {
        const [assignment] = await this.db
            .insert(financeMemberBillingPlans)
            .values(input)
            .onConflictDoUpdate({
                target: [
                    financeMemberBillingPlans.userId,
                    financeMemberBillingPlans.organizationId,
                    financeMemberBillingPlans.currencyId,
                ],
                set: {
                    billingPlanId: input.billingPlanId,
                    assignedBy: input.assignedBy,
                    // Note: 'assignedAt' is NOT updated to preserve original assignment date
                },
            })
            .returning();

        if (!assignment) throw new InternalServerError("Failed to upsert billing plan assignment");
        return assignment;
    }

    /**
     * Retrieves the active billing plan for a student in a specific currency.
     * Joins with finance_billing_plans and loads rates.
     * Relationship Sort: Rates are returned DESC by participantCount to facilitate "Closest Lower Tier" logic in the service.
     */
    async getMemberPlanByCurrency(
        userId: string,
        orgId: string,
        currencyId: string
    ): Promise<MemberPlanWithRates | null> {
        const result = await this.db.query.financeMemberBillingPlans.findFirst({
            where: and(
                eq(financeMemberBillingPlans.userId, userId),
                eq(financeMemberBillingPlans.organizationId, orgId),
                eq(financeMemberBillingPlans.currencyId, currencyId)
            ),
            with: {
                plan: {
                    with: {
                        rates: {
                            orderBy: [desc(financeBillingPlanRates.participantCount)],
                        },
                    },
                },
            },
        });

        return (result as MemberPlanWithRates) ?? null;
    }

    /**
     * Lists all billing plans for an organization with cursor pagination.
     */
    async listOrgPlans(orgId: string, cursor?: string, limit: number = 20) {
        const conditions = [eq(financeBillingPlans.organizationId, orgId)];

        // Cursor paginates descending by ID — lt() must match the desc() orderBy below
        if (cursor) {
            conditions.push(lt(financeBillingPlans.id, cursor));
        }

        const data = await this.db.query.financeBillingPlans.findMany({
            where: and(...conditions),
            orderBy: [desc(financeBillingPlans.id)],
            limit: limit + 1,
            with: { rates: true },
        });

        const hasNext = data.length > limit;
        const items = hasNext ? data.slice(0, limit) : data;
        const nextCursor = hasNext ? items[items.length - 1].id : null;

        return { items, nextCursor };
    }

    /**
     * Lists all billing plans assigned to a member.
     */
    async listMemberPlans(userId: string, orgId: string, cursor?: string, limit: number = 20) {
        const conditions = [
            eq(financeMemberBillingPlans.userId, userId),
            eq(financeMemberBillingPlans.organizationId, orgId),
        ];

        // Cursor paginates descending by ID — lt() must match the desc() orderBy below
        if (cursor) {
            conditions.push(lt(financeMemberBillingPlans.id, cursor));
        }

        const data = await this.db.query.financeMemberBillingPlans.findMany({
            where: and(...conditions),
            orderBy: [desc(financeMemberBillingPlans.id)],
            limit: limit + 1,
            with: {
                plan: true,
            },
        });

        const hasNext = data.length > limit;
        const items = hasNext ? data.slice(0, limit) : data;
        const nextCursor = hasNext ? items[items.length - 1].id : null;

        return { items, nextCursor };
    }

    /**
     * Removes a student's billing plan assignment.
     */
    async deleteMemberPlan(id: string) {
        return this.db
            .delete(financeMemberBillingPlans)
            .where(eq(financeMemberBillingPlans.id, id));
    }
}
