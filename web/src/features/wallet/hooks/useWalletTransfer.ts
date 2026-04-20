import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";

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
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].finance.transfer.$post({
                param: { organizationId: orgId },
                json: data,
            });
            return hcJson(res);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance", orgId] });
            queryClient.invalidateQueries({ queryKey: ["transactionHistory", orgId] });
        },
    });
};
