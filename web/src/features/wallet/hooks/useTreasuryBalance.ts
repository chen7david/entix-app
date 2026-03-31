import { API_V1 } from "@shared";
import { useQuery } from "@tanstack/react-query";

export const useTreasuryBalance = () => {
    return useQuery<{ balanceCents: number; balanceFormatted: string }>({
        queryKey: ["treasuryBalance"],
        queryFn: async () => {
            const res = await fetch(`${API_V1}/wallet/treasury/balance`);
            if (!res.ok) throw new Error("Failed to fetch treasury balance");
            return res.json();
        },
    });
};
