import { API_V1 } from "@shared";
import { useQuery } from "@tanstack/react-query";

export type CurrencyWithStatus = {
    id: string;
    code: string;
    name: string;
    symbol: string;
    isActivated: boolean;
    accountId: string | null;
    balanceCents: number | null;
};

export const useOrgCurrencies = (orgId?: string) => {
    return useQuery<{ currencies: CurrencyWithStatus[] }>({
        queryKey: ["orgCurrencies", orgId],
        queryFn: async () => {
            if (!orgId) throw new Error("Organization ID required");
            const res = await fetch(`${API_V1}/orgs/${orgId}/finance/currencies`);
            if (!res.ok) throw new Error("Failed to fetch currencies");
            return res.json();
        },
        enabled: !!orgId,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours — currencies rarely change
        gcTime: 1000 * 60 * 60 * 24,
    });
};

// Convenience selector — only activated currencies for dropdowns
export const useActivatedCurrencies = (orgId?: string) => {
    const query = useOrgCurrencies(orgId);
    return {
        ...query,
        data: query.data
            ? { currencies: query.data.currencies.filter((c) => c.isActivated) }
            : undefined,
    };
};
