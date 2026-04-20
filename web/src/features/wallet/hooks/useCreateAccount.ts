import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { App } from "antd";

export type CreateAccountInput = {
    name: string;
    currencyId: string;
    ownerType: "user" | "org";
    ownerId: string;
};

export const useCreateAccount = (orgId?: string) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateAccountInput) => {
            if (!orgId) throw new Error("Organization ID required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].finance.accounts.$post({
                param: { organizationId: orgId },
                json: input,
            });
            return hcJson(res);
        },
        onSuccess: () => {
            notification.success({
                message: "Account Created",
                description: "Your new financial account has been created successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["walletBalance", orgId] });
            queryClient.invalidateQueries({ queryKey: ["orgCurrencies", orgId] });
        },
        onError: (err: any) => {
            notification.error({
                message: "Creation Failed",
                description: err.message || "Failed to create account. Please try again.",
            });
        },
    });
};
