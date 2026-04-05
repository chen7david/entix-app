import { API_V1 } from "@shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";

export const useReverseTransaction = (orgId?: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ txId, reason }: { txId: string; reason: string }) => {
            if (!orgId) throw new Error("Organization ID required");
            const url = `${API_V1}/orgs/${orgId}/finance/transactions/${txId}/reverse`;

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to reverse transaction");
            }

            return res.json();
        },
        onSuccess: () => {
            message.success("Transaction reversed successfully");
            queryClient.invalidateQueries({ queryKey: ["transactions", orgId] });
            queryClient.invalidateQueries({ queryKey: ["walletBalance", orgId] });
        },
        onError: (error: Error) => {
            message.error(error.message);
        },
    });
};
