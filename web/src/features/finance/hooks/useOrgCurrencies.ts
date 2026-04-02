import { API_V1 } from "@shared";
import { useQuery } from "@tanstack/react-query";
import { parseApiError } from "@web/src/utils/api";

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
    return useQuery({
        queryKey: ["orgCurrencies", orgId],
        queryFn: async () => {
            if (!orgId) throw new Error("Organization ID required");
            const res = await fetch(`${API_V1}/orgs/${orgId}/finance/currencies`);
            if (!res.ok) await parseApiError(res);
            return (await res.json()) as { data: CurrencyWithStatus[] };
        },
        select: (res) => res?.data,
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
        currencies: query.data ? query.data.filter((c) => c.isActivated) : [],
    };
};
