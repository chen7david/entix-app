import { getAdminFinancialService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { AdminFinanceRoutes } from "./finance.routes";

export class AdminFinanceHandler {
    static getTreasuryBalance: AppHandler<typeof AdminFinanceRoutes.getTreasuryBalance> = async (
        ctx
    ) => {
        const accounts = await getAdminFinancialService(ctx).getTreasuryBalance();
        return ctx.json({ accounts }, HttpStatusCodes.OK);
    };

    static getOrgAccounts: AppHandler<typeof AdminFinanceRoutes.getOrgAccounts> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const accounts = await getAdminFinancialService(ctx).getAnyOrgAccounts(organizationId);
        return ctx.json({ accounts }, HttpStatusCodes.OK);
    };

    static adminCredit: AppHandler<typeof AdminFinanceRoutes.adminCredit> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const body = ctx.req.valid("json");

        const txId = await getAdminFinancialService(ctx).adminCredit({
            organizationId,
            ...body,
        });

        return ctx.json({ txId }, HttpStatusCodes.CREATED);
    };

    static adminDebit: AppHandler<typeof AdminFinanceRoutes.adminDebit> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const body = ctx.req.valid("json");

        const txId = await getAdminFinancialService(ctx).adminDebit({
            organizationId,
            ...body,
        });

        return ctx.json({ txId }, HttpStatusCodes.CREATED);
    };

    static updateAccount: AppHandler<typeof AdminFinanceRoutes.updateAccount> = async (ctx) => {
        const { id } = ctx.req.valid("param");
        const { name } = ctx.req.valid("json");

        const account = await getAdminFinancialService(ctx).updateAccount(id, name);
        return ctx.json({ account }, HttpStatusCodes.OK);
    };

    static archiveAccount: AppHandler<typeof AdminFinanceRoutes.archiveAccount> = async (ctx) => {
        const { id } = ctx.req.valid("param");

        try {
            await getAdminFinancialService(ctx).archiveAccount(id);
            return ctx.json({ success: true }, HttpStatusCodes.OK);
        } catch (error: any) {
            return ctx.json({ message: error.message }, HttpStatusCodes.BAD_REQUEST);
        }
    };
}
