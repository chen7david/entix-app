import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { App } from "antd";

export const useReverseTransaction = (orgId?: string) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ txId, reason }: { txId: string; reason: string }) => {
            if (!orgId) throw new Error("Organization ID required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].finance.transactions[
                ":txId"
            ].reverse.$post({
                param: { organizationId: orgId, txId },
                json: { reason },
            });
            return hcJson(res);
        },
        onSuccess: () => {
            notification.success({
                message: "Transaction Reversed",
                description: "The transaction has been reversed successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["transactions", orgId] });
            queryClient.invalidateQueries({ queryKey: ["walletBalance", orgId] });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Reversal Failed",
                description: error.message || "Failed to reverse transaction.",
            });
        },
    });
};
