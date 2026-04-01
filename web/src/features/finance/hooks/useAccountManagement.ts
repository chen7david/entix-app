import { API_V1 } from "@shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to update the display label (name) of a financial account.
 */
export const useUpdateAccount = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, name }: { id: string; name: string }) => {
            const res = await fetch(`${API_V1}/admin/finance/accounts/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to update account label");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
        },
    });
};

/**
 * Hook to archive a financial account.
 * Note: Will fail on backend if balance is non-zero.
 */
export const useArchiveAccount = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_V1}/admin/finance/accounts/${id}/archive`, {
                method: "PATCH",
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to archive account");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
        },
    });
};
