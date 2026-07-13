import { FINANCIAL_CATEGORIES, FINANCIAL_PRODUCT_RULES } from "@shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { App } from "antd";

type OrgMemberFundingAdjustment = {
    organizationId: string;
    /** Student savings account to credit or debit. */
    memberAccountId: string;
    /** Org funding account in the same currency. */
    orgFundingAccountId: string;
    amountCents: number;
    currencyId: string;
    description: string;
    type: "credit" | "debit";
};

/**
 * Org finance staff: move funds between org funding and a member wallet via
 * `/finance/transfer` (not super-admin credit/debit).
 */
export const useOrgFundMemberWallet = (orgId?: string) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: OrgMemberFundingAdjustment) => {
            if (!orgId) throw new Error("Organization ID required");

            const isCashCredit = input.type === "credit";
            const body = {
                categoryId: isCashCredit
                    ? FINANCIAL_PRODUCT_RULES.cashTopUpCategoryId
                    : FINANCIAL_CATEGORIES.INTERNAL_TRANSFER,
                sourceAccountId: isCashCredit ? input.orgFundingAccountId : input.memberAccountId,
                destinationAccountId: isCashCredit
                    ? input.memberAccountId
                    : input.orgFundingAccountId,
                currencyId: input.currencyId,
                amountCents: input.amountCents,
                description: input.description,
            };

            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].finance.transfer.$post({
                param: { organizationId: orgId },
                json: body,
            });
            return hcJson(res);
        },
        onSuccess: (_, variables) => {
            notification.success({
                message: "Adjustment Successful",
                description: `Member wallet ${variables.type}ed successfully.`,
            });
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
            queryClient.invalidateQueries({ queryKey: ["transactionHistory"] });
            queryClient.invalidateQueries({ queryKey: ["transactions", orgId] });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Adjustment Failed",
                description: error.message || "Failed to execute wallet adjustment.",
            });
        },
    });
};
