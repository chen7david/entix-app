import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
/**
 * Hook to update the display label (name) of a financial account.
 */
export const useUpdateAccount = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, name }: { id: string; name: string }) => {
            const api = getApiClient();
            const res = await api.api.v1.admin.finance.accounts[":id"].$patch({
                param: { id },
                json: { name },
            });
            return hcJson(res);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
            queryClient.invalidateQueries({ queryKey: ["adminOrgAccounts"] });
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
            const api = getApiClient();
            const res = await api.api.v1.admin.finance.accounts[":id"].archive.$patch({
                param: { id },
            });
            return hcJson(res);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
            queryClient.invalidateQueries({ queryKey: ["adminOrgAccounts"] });
        },
    });
};
