import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { App } from "antd";

export const useInitializeWallet = (organizationId: string) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].members[
                ":userId"
            ].wallet.initialize.$post({
                param: { organizationId, userId },
            });
            return hcJson(res);
        },
        onSuccess: (_data: any, userId: string) => {
            notification.success({
                message: "Wallet Initialized",
                description: _data.message || "Wallet initialization completed.",
            });

            void queryClient.invalidateQueries({ queryKey: ["organizationMembers"] });
            void queryClient.invalidateQueries({ queryKey: ["walletBalance", userId] });
            void queryClient.invalidateQueries({ queryKey: ["wallet-summary"] });
        },
        onError: (error: any) => {
            notification.error({
                message: "Initialization Failed",
                description: error.message || "Failed to initialize wallet.",
            });
        },
    });
};
