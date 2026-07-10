import { FINANCIAL_CATEGORIES, getTreasuryAccountId } from "@shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { App } from "antd";

type AdminAdjustment = {
    organizationId: string;
    accountId: string;
    amountCents: number;
    currencyId: string;
    description: string;
    type: "credit" | "debit";
    platformTreasuryAccountId?: string;
};

export const useAdminAdjustWallet = (orgId?: string) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: AdminAdjustment) => {
            if (!orgId) throw new Error("Organization ID required");

            const resolvedTreasuryId =
                input.platformTreasuryAccountId || getTreasuryAccountId(input.currencyId);

            const body =
                input.type === "credit"
                    ? {
                          categoryId: FINANCIAL_CATEGORIES.INTERNAL_TRANSFER,
                          platformTreasuryAccountId: resolvedTreasuryId,
                          destinationAccountId: input.accountId,
                          currencyId: input.currencyId,
                          amountCents: input.amountCents,
                          description: input.description,
                      }
                    : {
                          categoryId: FINANCIAL_CATEGORIES.INTERNAL_TRANSFER,
                          sourceAccountId: input.accountId,
                          platformTreasuryAccountId: resolvedTreasuryId,
                          currencyId: input.currencyId,
                          amountCents: input.amountCents,
                          description: input.description,
                      };

            const api = getApiClient();
            const res =
                input.type === "credit"
                    ? await api.api.v1.admin.finance.orgs[":organizationId"].credit.$post({
                          param: { organizationId: orgId },
                          json: body,
                      })
                    : await api.api.v1.admin.finance.orgs[":organizationId"].debit.$post({
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
            queryClient.invalidateQueries({ queryKey: ["transactions", orgId] });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Adjustment Failed",
                description: error.message || "Failed to execute admin adjustment.",
            });
        },
    });
};
