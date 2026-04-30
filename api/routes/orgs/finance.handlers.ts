import { getOrgFinancialService, getUserFinancialService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { FinanceRoutes } from "@api/routes/orgs/finance.routes";

export class FinanceHandler {
    static getWalletBalance: AppHandler<typeof FinanceRoutes.getBalance> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const summary = await getOrgFinancialService(ctx).getOrgSummary(organizationId);
        return ctx.json({ data: summary }, HttpStatusCodes.OK);
    };

    static getTransactionHistory: AppHandler<typeof FinanceRoutes.getTransactions> = async (
        ctx
    ) => {
        const { organizationId } = ctx.req.valid("param");
        const query = ctx.req.valid("query");

        const history = await getOrgFinancialService(ctx).getTransactionHistory(
            organizationId,
            query
        );

        return ctx.json(history, HttpStatusCodes.OK);
    };

    static reverseTransaction: AppHandler<typeof FinanceRoutes.reverseTransaction> = async (
        ctx
    ) => {
        const { organizationId, txId } = ctx.req.valid("param");
        const { reason } = ctx.req.valid("json");
        const reversalTxId = await getOrgFinancialService(ctx).reverseTransaction(
            txId,
            organizationId,
            reason
        );
        return ctx.json({ data: { txId: reversalTxId } }, HttpStatusCodes.CREATED);
    };

    static executeTransfer: AppHandler<typeof FinanceRoutes.executeTransfer> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const body = ctx.req.valid("json");

        const txId = await getOrgFinancialService(ctx).executeTransfer({
            organizationId,
            idempotencyKey: ctx.req.header("Idempotency-Key"),
            ...body,
        });

        return ctx.json({ data: { txId } }, HttpStatusCodes.CREATED);
    };

    static createAccount: AppHandler<typeof FinanceRoutes.createAccount> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const body = ctx.req.valid("json");

        const account = await getOrgFinancialService(ctx).createOrgAccount(
            {
                name: body.name,
                currencyId: body.currencyId,
                organizationId,
            },
            { allowMultiple: true }
        );

        return ctx.json({ data: account }, HttpStatusCodes.CREATED);
    };

    static listAccounts: AppHandler<typeof FinanceRoutes.listAccounts> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const accounts = await getOrgFinancialService(ctx).listOrgAccounts(organizationId);

        return ctx.json({ data: accounts }, HttpStatusCodes.OK);
    };

    static deactivateAccount: AppHandler<typeof FinanceRoutes.deactivateAccount> = async (ctx) => {
        const { accountId } = ctx.req.valid("param");
        await getOrgFinancialService(ctx).deactivateAccount(accountId);
        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };

    static getOrgCurrencyStatus: AppHandler<typeof FinanceRoutes.getOrgCurrencyStatus> = async (
        ctx
    ) => {
        const { organizationId } = ctx.req.valid("param");
        const currencies = await getOrgFinancialService(ctx).getOrgCurrencyStatus(organizationId);
        return ctx.json({ data: currencies }, HttpStatusCodes.OK);
    };

    static activateCurrency: AppHandler<typeof FinanceRoutes.activateCurrency> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const { currencyId } = ctx.req.valid("json");
        const account = await getOrgFinancialService(ctx).activateCurrency(
            organizationId,
            currencyId
        );
        return ctx.json({ data: account }, HttpStatusCodes.CREATED);
    };

    static initializeUserWallet: AppHandler<typeof FinanceRoutes.initializeUserWallet> = async (
        ctx
    ) => {
        const { organizationId, userId } = ctx.req.valid("param");
        await getUserFinancialService(ctx).provisionUserAccounts(userId, organizationId);
        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };
}
