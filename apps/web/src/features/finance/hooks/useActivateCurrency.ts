import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { App } from "antd";

export const useActivateCurrency = (orgId?: string) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (currencyId: string) => {
            if (!orgId) throw new Error("Organization ID required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].finance.currencies.activate.$post({
                param: { organizationId: orgId },
                json: { currencyId },
            });
            return hcJson(res);
        },
        onSuccess: () => {
            notification.success({
                message: "Currency Activated",
                description: "The currency has been activated for your organization.",
            });
            queryClient.invalidateQueries({ queryKey: ["orgCurrencies", orgId] });
            queryClient.invalidateQueries({ queryKey: ["walletBalance", orgId] });
        },
        onError: () => {
            notification.error({
                message: "Activation Failed",
                description: "Failed to activate currency. It may already be active.",
            });
        },
    });
};
