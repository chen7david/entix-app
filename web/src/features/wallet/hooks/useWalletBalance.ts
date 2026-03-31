import { API_V1 } from "@shared";
import { useQuery } from "@tanstack/react-query";

export type WalletAccount = {
    id: string;
    name: string;
    balanceCents: number;
    currencyId: string;
    isActive: boolean;
};

export type WalletSummary = {
    accounts: WalletAccount[];
};

export const useWalletBalance = (orgId?: string) => {
    return useQuery<WalletSummary>({
        queryKey: ["walletBalance", orgId],
        queryFn: async () => {
            if (!orgId) throw new Error("Organization ID required");
            const res = await fetch(`${API_V1}/orgs/${orgId}/wallet/balance`);
            if (!res.ok) throw new Error("Failed to fetch wallet balance");
            return res.json();
        },
        enabled: !!orgId,
    });
};
