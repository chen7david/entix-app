import { getFinancialService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { WalletRoutes } from "@api/routes/orgs/wallet.routes";

export class WalletHandler {
    static getWalletBalance: AppHandler<typeof WalletRoutes.getBalance> = async (ctx) => {
        const userId = ctx.get("userId");
        const financialService = getFinancialService(ctx);

        const summary = await financialService.getWalletSummary(userId, "user");
        return ctx.json(summary, HttpStatusCodes.OK);
    };

    static getTransactionHistory: AppHandler<typeof WalletRoutes.getTransactions> = async (ctx) => {
        const organizationId = ctx.get("organizationId");
        const { page, pageSize } = ctx.req.valid("query");

        const financialService = getFinancialService(ctx);
        const history = await financialService.getTransactionHistory(organizationId, {
            page: page ?? 1,
            pageSize: pageSize ?? 20,
        });

        return ctx.json(
            {
                data: history,
                page: page ?? 1,
                pageSize: pageSize ?? 20,
            },
            HttpStatusCodes.OK
        );
    };

    static executeTransfer: AppHandler<typeof WalletRoutes.executeTransfer> = async (ctx) => {
        const organizationId = ctx.get("organizationId");
        const body = ctx.req.valid("json");
        const financialService = getFinancialService(ctx);

        const txId = await financialService.executeTransfer({
            organizationId,
            ...body,
        });

        return ctx.json({ txId }, HttpStatusCodes.CREATED);
    };

    static adminCredit: AppHandler<typeof WalletRoutes.adminCredit> = async (ctx) => {
        const organizationId = ctx.get("organizationId");
        const body = ctx.req.valid("json");
        const financialService = getFinancialService(ctx);

        const txId = await financialService.adminCredit({
            organizationId,
            ...body,
        });

        return ctx.json({ txId }, HttpStatusCodes.CREATED);
    };

    static adminDebit: AppHandler<typeof WalletRoutes.adminDebit> = async (ctx) => {
        const organizationId = ctx.get("organizationId");
        const body = ctx.req.valid("json");
        const financialService = getFinancialService(ctx);

        const txId = await financialService.adminDebit({
            organizationId,
            ...body,
        });

        return ctx.json({ txId }, HttpStatusCodes.CREATED);
    };

    static createAccount: AppHandler<typeof WalletRoutes.createAccount> = async (ctx) => {
        const organizationId = ctx.get("organizationId");
        const body = ctx.req.valid("json");
        const financialService = getFinancialService(ctx);

        const account = await financialService.createAccount({
            name: body.name,
            currencyId: body.currencyId,
            ownerType: body.ownerType,
            // Default ownerId to the org itself if ownerType is org
            ownerId: body.ownerType === "org" ? organizationId : body.ownerId,
        });

        return ctx.json(account, HttpStatusCodes.CREATED);
    };

    static listAccounts: AppHandler<typeof WalletRoutes.listAccounts> = async (ctx) => {
        const userId = ctx.get("userId");
        const financialService = getFinancialService(ctx);

        const accounts = await financialService.listAccounts(userId, "user");
        return ctx.json({ accounts }, HttpStatusCodes.OK);
    };

    static deactivateAccount: AppHandler<typeof WalletRoutes.deactivateAccount> = async (ctx) => {
        const { accountId } = ctx.req.valid("param");
        const financialService = getFinancialService(ctx);

        const account = await financialService.deactivateAccount(accountId);
        return ctx.json(account, HttpStatusCodes.OK);
    };

    static adminGetOrgAccounts: AppHandler<typeof WalletRoutes.adminGetOrgAccounts> = async (
        ctx
    ) => {
        const { organizationId } = ctx.req.valid("param");
        const financialService = getFinancialService(ctx);
        const accounts = await financialService.getOrgAccounts(organizationId);
        return ctx.json({ accounts }, HttpStatusCodes.OK);
    };

    static adminGetTreasuryBalance: AppHandler<typeof WalletRoutes.adminGetTreasuryBalance> =
        async (ctx) => {
            const financialService = getFinancialService(ctx);
            const balance = await financialService.getTreasuryBalance();
            return ctx.json(balance, HttpStatusCodes.OK);
        };

    static getOrgCurrencyStatus: AppHandler<typeof WalletRoutes.getOrgCurrencyStatus> = async (
        ctx
    ) => {
        const organizationId = ctx.get("organizationId");
        const financialService = getFinancialService(ctx);
        const currencies = await financialService.getOrgCurrencyStatus(organizationId);
        return ctx.json({ currencies }, HttpStatusCodes.OK);
    };

    static activateCurrency: AppHandler<typeof WalletRoutes.activateCurrency> = async (ctx) => {
        const organizationId = ctx.get("organizationId");
        const { currencyId } = ctx.req.valid("json");
        const financialService = getFinancialService(ctx);
        const account = await financialService.activateCurrency(organizationId, currencyId);
        return ctx.json(account, HttpStatusCodes.CREATED);
    };
}
