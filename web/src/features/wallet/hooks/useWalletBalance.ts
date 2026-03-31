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

export const useWalletBalance = (
    id?: string,
    ownerType: "user" | "org" = "org",
    orgId?: string
) => {
    return useQuery<WalletSummary>({
        queryKey: ["walletBalance", id, ownerType, orgId],
        queryFn: async () => {
            if (!id) throw new Error("ID required");
            const url =
                ownerType === "org"
                    ? `${API_V1}/orgs/${id}/finance/summary`
                    : `${API_V1}/orgs/${orgId}/members/${id}/wallet/summary`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch wallet balance");
            return res.json();
        },
        enabled: !!id,
    });
};
