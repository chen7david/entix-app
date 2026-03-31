import { API_V1 } from "@shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";

export const useActivateCurrency = (orgId?: string) => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (currencyId: string) => {
            if (!orgId) throw new Error("Organization ID required");
            const res = await fetch(`${API_V1}/orgs/${orgId}/finance/currencies/activate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currencyId }),
            });
            if (!res.ok) throw new Error("Failed to activate currency");
            return res.json();
        },
        onSuccess: () => {
            message.success("Currency activated successfully");
            // Invalidate currency cache so UI updates immediately
            queryClient.invalidateQueries({ queryKey: ["orgCurrencies", orgId] });
            queryClient.invalidateQueries({ queryKey: ["walletBalance", orgId] });
        },
        onError: () => {
            message.error("Failed to activate currency. It may already be active.");
        },
    });
};
