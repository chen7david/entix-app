import { ConflictError, NotFoundError } from "@api/errors/app.error";
import type { FinanceBillingPlansRepository } from "@api/repositories/financial/finance-billing-plans.repository";
import {
    generateBillingPlanId,
    generateBillingPlanRateId,
    generateMemberBillingPlanId,
} from "@shared";
import type { BillingPlan, financeBillingPlanRates } from "@shared/db/schema";
import type {
    AssignBillingPlanInput,
    BillingPlanPaginationInput,
    CreateBillingPlanInput,
    UpdateBillingPlanInput,
} from "@shared/schemas/dto/billing-plan.dto";
import { BaseService } from "../base.service";

/**
 * Service for managing Billing Plans and Student Assignments.
 */
export class FinanceBillingPlansService extends BaseService {
    constructor(private readonly repo: FinanceBillingPlansRepository) {
        super();
    }

    /**
     * Creates a new organization-level billing plan.
     */
    async createPlan(orgId: string, input: CreateBillingPlanInput) {
        const id = generateBillingPlanId();
        const rates = input.rates.map((r) => ({
            id: generateBillingPlanRateId(),
            billingPlanId: id,
            participantCount: r.participantCount,
            rateCentsPerMinute: r.rateCentsPerMinute,
        }));

        return this.repo.createPlan(
            {
                id,
                organizationId: orgId,
                name: input.name,
                description: input.description ?? null,
                currencyId: input.currencyId,
                isActive: true,
                overdraftLimitCents: input.overdraftLimitCents ?? 0,
            },
            rates
        );
    }

    /**
     * Atomically assigns or replaces a billing plan for a member.
     * Note: Handlers for both POST (assign) and PUT (replace) now delegate to this atomic upsert.
     */
    async assignPlan(orgId: string, input: AssignBillingPlanInput, assignedBy?: string) {
        const { userId, planId } = input;

        const plan = await this.repo.findById(planId);
        if (!plan || plan.organizationId !== orgId) {
            throw new NotFoundError("Billing plan not found");
        }

        const id = generateMemberBillingPlanId();
        return this.repo.upsertMemberPlan({
            id,
            userId,
            organizationId: orgId,
            billingPlanId: planId,
            currencyId: plan.currencyId,
            assignedBy: assignedBy ?? null,
        });
    }

    /**
     * Lists organization-level billing plans with pagination and search.
     */
    async listOrgPlans(orgId: string, pagination: BillingPlanPaginationInput) {
        return this.repo.listOrgPlans(
            orgId,
            pagination.cursor,
            pagination.limit,
            pagination.search
        );
    }

    /**
     * Lists a member's billing plan assignments.
     */
    async listMemberPlans(userId: string, orgId: string, pagination: BillingPlanPaginationInput) {
        return this.repo.listMemberPlans(userId, orgId, pagination.cursor, pagination.limit);
    }

    /**
     * Removes a student's billing plan assignment.
     * Fintech Security: Returns 404 if the assignment doesn't exist OR belongs to another user
     * to prevent information leakage.
     */
    async unassignPlan(orgId: string, userId: string, assignmentId: string) {
        const assignment = await this.repo.findMemberPlanById(assignmentId);

        // Security: Assignment must exist, belong to this org, AND belong to this specific user.
        if (!assignment || assignment.organizationId !== orgId || assignment.userId !== userId) {
            throw new NotFoundError("Plan assignment not found");
        }

        return this.repo.deleteMemberPlan(assignmentId);
    }

    /**
     * Gets a member's active billing plan for a specific currency.
     * Narrowing: Ensures that the returned object has a guaranteed non-null plan and rates array.
     */
    async getMemberBillingPlan(userId: string, orgId: string, currencyId: string) {
        const assignment = await this.repo.getMemberPlanByCurrency(userId, orgId, currencyId);

        if (!assignment?.plan?.isActive) {
            throw new NotFoundError(
                `No active billing plan assigned for student ${userId} (Org ${orgId}) in currency ${currencyId}`
            );
        }

        // TypeScript narrowing via non-null assertion or re-casting after the check
        return assignment.plan as BillingPlan & {
            rates: (typeof financeBillingPlanRates.$inferSelect)[];
        };
    }

    /**
     * Resolves the rate for a student in a specific currency based on participant count.
     * Logic: Closest Lower Tier.
     */
    async resolveBillingPlanRate(
        userId: string,
        orgId: string,
        currencyId: string,
        participantCount: number
    ): Promise<number> {
        const plan = await this.getMemberBillingPlan(userId, orgId, currencyId);

        // Search using "Closest Lower Tier" logic.
        // Rates are explicitly sorted DESC to ensure the highest tier ≤ headcount is picked first.
        const sortedRates = [...plan.rates].sort((a, b) => b.participantCount - a.participantCount);
        const rateEntry = sortedRates.find((r) => r.participantCount <= participantCount);

        if (!rateEntry) {
            throw new NotFoundError(
                `Billing plan ${plan.name} (${plan.id}) has no tier for session size: ${participantCount}. (Minimum required: ${sortedRates.at(-1)?.participantCount ?? "N/A"})`
            );
        }

        return rateEntry.rateCentsPerMinute;
    }

    /**
     * Updates an existing billing plan with organization scope check.
     */
    async updatePlan(orgId: string, planId: string, updates: UpdateBillingPlanInput) {
        const plan = await this.repo.findById(planId);
        if (!plan || plan.organizationId !== orgId) {
            throw new NotFoundError("Billing plan not found");
        }
        const updated = await this.repo.updatePlan(planId, updates);
        if (!updated) {
            throw new NotFoundError("Billing plan not found");
        }
        return updated;
    }

    /**
     * Deletes a billing plan with organization scope check.
     */
    async deletePlan(orgId: string, planId: string) {
        const plan = await this.repo.findById(planId);
        if (!plan || plan.organizationId !== orgId) {
            throw new NotFoundError("Billing plan not found");
        }
        try {
            const deleted = await this.repo.deletePlan(planId);
            if (!deleted) {
                throw new NotFoundError("Billing plan not found");
            }
            return deleted;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes("FOREIGN KEY constraint failed")) {
                throw new ConflictError(
                    "This billing plan is assigned to one or more members and cannot be deleted. " +
                        "Deactivate it using the Active toggle instead."
                );
            }
            throw e;
        }
    }
}
