import { ConflictError, NotFoundError } from "@api/errors/app.error";
import type { FinanceBillingPlansRepository } from "@api/repositories/financial/finance-billing-plans.repository";
import {
    generateBillingPlanId,
    generateBillingPlanRateId,
    generateMemberBillingPlanId,
} from "@shared";
import type {
    AssignBillingPlanInput,
    BillingPlanPaginationInput,
    CreateBillingPlanInput,
} from "@shared/schemas/dto/billing-plan.dto";

/**
 * Service for managing Billing Plans and Student Assignments.
 */
export class FinanceBillingPlansService {
    constructor(private readonly repo: FinanceBillingPlansRepository) {}

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
            },
            rates
        );
    }

    /**
     * Assigns a billing plan to a member (student).
     * Enforces uniqueness (1 plan per currency per org).
     */
    async assignPlan(orgId: string, input: AssignBillingPlanInput, assignedBy?: string) {
        const { userId, planId } = input;

        const plan = await this.repo.findById(planId);
        if (!plan || plan.organizationId !== orgId) {
            throw new NotFoundError("Billing plan not found");
        }

        const existing = await this.repo.getMemberPlanByCurrency(userId, orgId, plan.currencyId);
        if (existing) {
            throw new ConflictError(
                `Student already has an active billing plan for ${plan.currencyId} in this organization. Use replace instead.`
            );
        }

        const id = generateMemberBillingPlanId();
        return this.repo.createMemberPlan({
            id,
            userId,
            organizationId: orgId,
            billingPlanId: planId,
            currencyId: plan.currencyId,
            assignedBy: assignedBy ?? null,
        });
    }

    /**
     * Atomically replaces a student's billing plan for a specific currency.
     */
    async replacePlan(orgId: string, input: AssignBillingPlanInput, assignedBy?: string) {
        const { userId, planId } = input;

        const plan = await this.repo.findById(planId);
        if (!plan || plan.organizationId !== orgId) {
            throw new NotFoundError("Billing plan not found");
        }

        const id = generateMemberBillingPlanId();
        return this.repo.replaceMemberPlan(userId, orgId, plan.currencyId, {
            id,
            userId,
            organizationId: orgId,
            billingPlanId: planId,
            currencyId: plan.currencyId,
            assignedBy: assignedBy ?? null,
        });
    }

    /**
     * Lists organization-level billing plans with pagination.
     */
    async listOrgPlans(orgId: string, pagination: BillingPlanPaginationInput) {
        return this.repo.listOrgPlans(orgId, pagination.cursor, pagination.limit);
    }

    /**
     * Lists a member's billing plan assignments.
     */
    async listMemberPlans(userId: string, orgId: string, pagination: BillingPlanPaginationInput) {
        return this.repo.listMemberPlans(userId, orgId, pagination.cursor, pagination.limit);
    }

    /**
     * Removes a student's billing plan assignment.
     */
    async unassignPlan(orgId: string, assignmentId: string) {
        const assignment = await this.repo.findMemberPlanById(assignmentId);
        if (!assignment || assignment.organizationId !== orgId) {
            throw new NotFoundError("Plan assignment not found");
        }
        return this.repo.deleteMemberPlan(assignmentId);
    }

    /**
     * Resolves the rate for a student in a specific currency based on participant count.
     * Throws NotFoundError if no exact match for the participant count is found.
     */
    async resolveBillingPlanRate(
        userId: string,
        orgId: string,
        currencyId: string,
        participantCount: number
    ): Promise<number> {
        const assignment = await this.repo.getMemberPlanByCurrency(userId, orgId, currencyId);

        if (!assignment?.plan?.isActive) {
            throw new NotFoundError(
                `No active billing plan assigned for student ${userId} (Org ${orgId}) in currency ${currencyId}`
            );
        }

        const plan = assignment.plan as any; // Cast to access joined rates
        const rateEntry = plan.rates?.find((r: any) => r.participantCount === participantCount);

        if (!rateEntry) {
            throw new NotFoundError(
                `Billing plan ${plan.name} (${plan.id}) is not configured for session size: ${participantCount}`
            );
        }

        return rateEntry.rateCentsPerMinute;
    }
}
