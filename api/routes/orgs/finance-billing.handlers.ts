import { getFinanceBillingPlansService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { FinanceBillingRoutes } from "@api/routes/orgs/finance.routes";

/**
 * Handlers for Billing Plan operations.
 */
export class FinanceBillingHandler {
    static createPlan: AppHandler<typeof FinanceBillingRoutes.createPlan> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const body = ctx.req.valid("json");

        const plan = await getFinanceBillingPlansService(ctx).createPlan(organizationId, body);
        return ctx.json({ data: plan }, HttpStatusCodes.CREATED);
    };

    static listOrgPlans: AppHandler<typeof FinanceBillingRoutes.listOrgPlans> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const query = ctx.req.valid("query");

        const result = await getFinanceBillingPlansService(ctx).listOrgPlans(organizationId, query);
        return ctx.json({ data: result.items, nextCursor: result.nextCursor }, HttpStatusCodes.OK);
    };

    static assignMemberPlan: AppHandler<typeof FinanceBillingRoutes.assignMemberPlan> = async (
        ctx
    ) => {
        const { organizationId, userId } = ctx.req.valid("param");
        const body = ctx.req.valid("json");
        const currentUserId = ctx.get("userId");

        const assignment = await getFinanceBillingPlansService(ctx).assignPlan(
            organizationId,
            { ...body, userId },
            currentUserId
        );
        return ctx.json({ data: assignment }, HttpStatusCodes.CREATED);
    };

    static replaceMemberPlan: AppHandler<typeof FinanceBillingRoutes.replaceMemberPlan> = async (
        ctx
    ) => {
        const { organizationId, userId } = ctx.req.valid("param");
        const body = ctx.req.valid("json");
        const currentUserId = ctx.get("userId");

        const assignment = await getFinanceBillingPlansService(ctx).replacePlan(
            organizationId,
            { ...body, userId },
            currentUserId
        );
        return ctx.json({ data: assignment }, HttpStatusCodes.OK);
    };

    static listMemberPlans: AppHandler<typeof FinanceBillingRoutes.listMemberPlans> = async (
        ctx
    ) => {
        const { organizationId, userId } = ctx.req.valid("param");
        const query = ctx.req.valid("query");

        const result = await getFinanceBillingPlansService(ctx).listMemberPlans(
            userId,
            organizationId,
            query
        );
        const mappedItems = result.items.map((item) => ({
            ...item,
            planId: item.billingPlanId,
        }));
        return ctx.json({ data: mappedItems, nextCursor: result.nextCursor }, HttpStatusCodes.OK);
    };

    static unassignMemberPlan: AppHandler<typeof FinanceBillingRoutes.unassignMemberPlan> = async (
        ctx
    ) => {
        const { organizationId, assignmentId } = ctx.req.valid("param");
        await getFinanceBillingPlansService(ctx).unassignPlan(organizationId, assignmentId);
        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };
}
