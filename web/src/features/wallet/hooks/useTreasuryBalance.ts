import { API_V1 } from "@shared";
import { useQuery } from "@tanstack/react-query";
import type { WalletAccount } from "./useWalletBalance";

export const useTreasuryBalance = () => {
    return useQuery<WalletAccount[]>({
        queryKey: ["treasuryBalance"],
        queryFn: async () => {
            const res = await fetch(`${API_V1}/admin/finance/treasury/balance`);
            if (res.status === 404) return [];
            if (!res.ok) throw new Error("Failed to fetch treasury balance");
            const data = await res.json();
            return data.accounts || [];
        },
    });
};
