import { getUserFinancialService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { MemberWalletRoutes } from "./member-wallet.routes";

/**
 * Validates that the caller has permission to view/manage the member's wallet.
 * Permission is granted if:
 * 1. The caller is the user themselves (params.userId === ctx.userId)
 * 2. The caller is an admin or owner of the specified organization
 */
const authorizeWalletAccess = (c: any, userId: string, _organizationId: string): boolean => {
    const callerId = c.get("userId");
    const callerRole = c.get("role"); // requireOrgMembership middleware sets this

    if (callerId === userId) return true;
    if (callerRole === "admin" || callerRole === "owner") return true;

    return false;
};

export const getSummary: AppHandler<typeof MemberWalletRoutes.getSummary> = async (c) => {
    const { organizationId, userId } = c.req.valid("param");

    if (!authorizeWalletAccess(c, userId, organizationId)) {
        return c.json(
            { message: "Access denied: You can only view your own wallet or have admin access." },
            HttpStatusCodes.FORBIDDEN
        );
    }

    const service = getUserFinancialService(c);
    const result = await service.getUserSummary(userId, organizationId);

    return c.json(result, HttpStatusCodes.OK);
};

export const getTransactions: AppHandler<typeof MemberWalletRoutes.getTransactions> = async (c) => {
    const { organizationId, userId } = c.req.valid("param");
    const query = c.req.valid("query");

    if (!authorizeWalletAccess(c, userId, organizationId)) {
        return c.json(
            { message: "Access denied: You can only view your own transaction history." },
            HttpStatusCodes.FORBIDDEN
        );
    }

    const service = getUserFinancialService(c);
    const result = await service.getTransactionHistory(userId, organizationId, query);

    return c.json(result, HttpStatusCodes.OK);
};

export const initializeWallet: AppHandler<typeof MemberWalletRoutes.initializeWallet> = async (
    c
) => {
    const { organizationId, userId } = c.req.valid("param");

    if (!authorizeWalletAccess(c, userId, organizationId)) {
        return c.json(
            { message: "Access denied: Only members or admins can initialize wallets." },
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
