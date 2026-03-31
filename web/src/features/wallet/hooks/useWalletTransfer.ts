import { API_V1 } from "@shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type TransferInput = {
    categoryId: string;
    sourceAccountId: string;
    destinationAccountId: string;
    currencyId: string;
    amountCents: number;
    description?: string;
};

export const useWalletTransfer = (orgId?: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: TransferInput) => {
            if (!orgId) throw new Error("Organization ID required");
            const res = await fetch(`${API_V1}/orgs/${orgId}/wallet/transfer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Transfer failed. Please check balance.");
            return res.json();
        },
        onSuccess: () => {
            // Invalidate queries to refresh balance and history
            queryClient.invalidateQueries({ queryKey: ["walletBalance", orgId] });
            queryClient.invalidateQueries({ queryKey: ["transactionHistory", orgId] });
        },
    });
};
