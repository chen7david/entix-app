import { ConflictError, NotFoundError } from "@api/errors/app.error";
import type { AppDb } from "@api/factories/db.factory";
import { generateBillingPlanRateId } from "@shared";
import {
    type BillingPlan,
    financeBillingPlanRates,
    financeBillingPlans,
    financeMemberBillingPlans,
    type MemberBillingPlan,
    type NewBillingPlan,
} from "@shared/db/schema";
import type { UpdateBillingPlanInput } from "@shared/schemas/dto/billing-plan.dto";
import { and, desc, eq, lt, sql } from "drizzle-orm";

/**
 * Composite type for a member's plan assignment including tiered rates.
 */
export type MemberPlanWithRates = MemberBillingPlan & {
    plan:
        | (BillingPlan & {
              rates: (typeof financeBillingPlanRates.$inferSelect)[];
          })
        | null;
};

/**
 * Repository for organization billing plans and student assignments.
 */
export class FinanceBillingPlansRepository {
    constructor(private readonly db: AppDb) {}

    /**
     * Creates a new organization-level billing plan.
     * Uses db.batch() for Cloudflare D1 compatibility.
     */
    async createPlan(plan: NewBillingPlan, rates: (typeof financeBillingPlanRates.$inferInsert)[]) {
        const statements: any[] = [this.db.insert(financeBillingPlans).values(plan).returning()];

        if (rates.length > 0) {
            statements.push(this.db.insert(financeBillingPlanRates).values(rates));
        }

        const results = await this.db.batch(statements as any);
        const [newPlan] = results[0] as any;
        return newPlan as BillingPlan;
    }

    /**
     * Atomically assigns or replaces a member's billing plan.
     * Note: On conflict (update path), the existing record's `id` and `assignedAt` are preserved.
     * The `id` passed in the `assignment` object is only used for new insertions.
     */
    async upsertMemberPlan(
        input: typeof financeMemberBillingPlans.$inferInsert
    ): Promise<MemberBillingPlan> {
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
                    // We DO NOT update assignedAt or id here to preserve original audit trail
                },
            })
            .returning();

        return assignment;
    }

    /**
     * Finds a plan by its ID.
     */
    async findById(id: string) {
        return this.db.query.financeBillingPlans.findFirst({
            where: eq(financeBillingPlans.id, id),
            with: {
                rates: {
                    orderBy: [desc(financeBillingPlanRates.participantCount)],
                },
            },
        });
    }

    /**
     * Finds a student's active plan for a specific currency.
     * Returns the assignment and the associated plan with its rate tiers.
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
     * Lists all billing plans for an organization with cursor pagination and search.
     * Fix: Ensured cursor (lt) and order (desc) are consistent on the same column (id).
     */
    async listOrgPlans(orgId: string, cursor?: string, limit: number = 20, search?: string) {
        const conditions = [eq(financeBillingPlans.organizationId, orgId)];

        // Correct pairing for DESC ordering: lt(id, cursor)
        if (cursor) {
            conditions.push(lt(financeBillingPlans.id, cursor));
        }

        if (search) {
            conditions.push(
                sql`lower(${financeBillingPlans.name}) LIKE ${`%${search.toLowerCase()}%`}`
            );
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
     * Lists a member's billing plan assignments.
     */
    async listMemberPlans(userId: string, orgId: string, cursor?: string, limit: number = 20) {
        const conditions = [
            eq(financeMemberBillingPlans.userId, userId),
            eq(financeMemberBillingPlans.organizationId, orgId),
        ];

        if (cursor) {
            conditions.push(lt(financeMemberBillingPlans.id, cursor));
        }

        const data = await this.db.query.financeMemberBillingPlans.findMany({
            where: and(...conditions),
            orderBy: [desc(financeMemberBillingPlans.id)],
            limit: limit + 1,
            with: { plan: true },
        });

        const hasNext = data.length > limit;
        const items = hasNext ? data.slice(0, limit) : data;
        const nextCursor = hasNext ? items[items.length - 1].id : null;

        return { items, nextCursor };
    }

    /**
     * Finds a member plan assignment by ID.
     */
    async findMemberPlanById(id: string) {
        return this.db.query.financeMemberBillingPlans.findFirst({
            where: eq(financeMemberBillingPlans.id, id),
        });
    }

    /**
     * Updates an organization-level billing plan.
     * Uses db.batch() instead of .transaction() for D1 compatibility.
     */
    async updatePlan(planId: string, updates: UpdateBillingPlanInput): Promise<BillingPlan> {
        const statements: any[] = [
            this.db
                .update(financeBillingPlans)
                .set({
                    name: updates.name,
                    description: updates.description,
                    isActive: updates.isActive,
                    overdraftLimitCents: updates.overdraftLimitCents,
                    updatedAt: new Date(),
                })
                .where(eq(financeBillingPlans.id, planId))
                .returning(),
        ];

        if (updates.rates !== undefined) {
            // Delete existing rates
            statements.push(
                this.db
                    .delete(financeBillingPlanRates)
                    .where(eq(financeBillingPlanRates.billingPlanId, planId))
            );

            // Insert new rates if provided
            if (updates.rates.length > 0) {
                const newRates = updates.rates.map((r) => ({
                    id: generateBillingPlanRateId(),
                    billingPlanId: planId,
                    participantCount: r.participantCount,
                    rateCentsPerMinute: r.rateCentsPerMinute,
                }));
                statements.push(this.db.insert(financeBillingPlanRates).values(newRates));
            }
        }

        const results = await this.db.batch(statements as any);
        const [plan] = results[0] as any;

        if (!plan) throw new NotFoundError("Billing plan not found");
        return plan as BillingPlan;
    }

    /**
     * Deletes a billing plan.
     * RESTRICT Constraint: Throws ConflictError if any members are currently assigned to this plan.
     */
    async deletePlan(planId: string) {
        try {
            const [deleted] = await this.db
                .delete(financeBillingPlans)
                .where(eq(financeBillingPlans.id, planId))
                .returning();

            if (!deleted) throw new NotFoundError("Billing plan not found");
            return deleted;
        } catch (e: any) {
            // Catch D1/SQLite RESTRICT constraint failure specifically
            if (e?.message?.includes("FOREIGN KEY constraint failed")) {
                throw new ConflictError(
                    "This billing plan is assigned to one or more members and cannot be deleted. " +
                        "Deactivate it using the Active toggle instead."
                );
            }
            throw e;
        }
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
