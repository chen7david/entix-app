import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { App } from "antd";

export type AdminCreditInput = {
    organizationId: string;
    categoryId: string;
    platformTreasuryAccountId: string;
    destinationAccountId: string;
    currencyId: string;
    amountCents: number;
    description?: string;
};

export const useAdminCredit = () => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: AdminCreditInput) => {
            const api = getApiClient();
            const res = await api.api.v1.admin.finance.orgs[":organizationId"].credit.$post({
                param: { organizationId: input.organizationId },
                json: input,
            });
            return hcJson(res);
        },
        onSuccess: (_, vars) => {
            notification.success({
                message: "Credit Successful",
                description: "The account has been credited successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["adminOrgAccounts", vars.organizationId] });
            queryClient.invalidateQueries({ queryKey: ["treasuryBalance"] });
        },
        onError: (error) => {
            notification.error({
                message: "Credit Failed",
                description: error.message,
            });
        },
    });
};
