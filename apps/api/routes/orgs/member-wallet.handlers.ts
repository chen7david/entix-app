import { getUserFinancialService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import {
    canAccessMemberWallet,
    canManageMemberWallet,
} from "@api/services/financial/wallet-access.service";
import type { MemberWalletRoutes } from "./member-wallet.routes";

export const getSummary: AppHandler<typeof MemberWalletRoutes.getSummary> = async (c) => {
    const { organizationId, userId } = c.req.valid("param");

    if (!canAccessMemberWallet(c, userId, organizationId)) {
        return c.json(
            {
                message:
                    "Access denied: You can only view your own wallet or have finance staff access.",
            },
            HttpStatusCodes.FORBIDDEN
        );
    }

    const service = getUserFinancialService(c);
    const result = await service.getUserSummary(userId, organizationId);

    return c.json({ data: result }, HttpStatusCodes.OK);
};

export const getTransactions: AppHandler<typeof MemberWalletRoutes.getTransactions> = async (c) => {
    const { organizationId, userId } = c.req.valid("param");
    const query = c.req.valid("query");

    if (!canAccessMemberWallet(c, userId, organizationId)) {
        return c.json(
            { message: "Access denied: You can only view your own transaction history." },
            HttpStatusCodes.FORBIDDEN
        );
    }

    const service = getUserFinancialService(c);
    const { cursor, limit, ...filters } = query;
    const result = await service.getTransactionHistory(
        userId,
        organizationId,
        { cursor, limit },
        filters
    );

    return c.json(result, HttpStatusCodes.OK);
};

export const initializeWallet: AppHandler<typeof MemberWalletRoutes.initializeWallet> = async (
    c
) => {
    const { organizationId, userId } = c.req.valid("param");

    if (!canManageMemberWallet(c, userId, organizationId)) {
        return c.json(
            { message: "Access denied: Only finance staff can initialize wallets." },
            HttpStatusCodes.FORBIDDEN
        );
    }

    const service = getUserFinancialService(c);
    await service.provisionUserAccounts(userId, organizationId);

    return c.json(
        { success: true, message: "Wallets initialized successfully" },
        HttpStatusCodes.OK
    );
};
