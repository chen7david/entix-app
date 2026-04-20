import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_CATALOG_MS } from "@web/src/lib/query-config";

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
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].finance.currencies.$get({
                param: { organizationId: orgId },
            });
            return hcJson<{ data: CurrencyWithStatus[] }>(res);
        },
        select: (res) => res?.data,
        enabled: !!orgId,
        staleTime: QUERY_STALE_CATALOG_MS,
        gcTime: QUERY_STALE_CATALOG_MS,
    });
};

/** Convenience selector — only activated currencies for dropdowns */
export const useActivatedCurrencies = (orgId?: string) => {
    const query = useOrgCurrencies(orgId);

    return {
        ...query,
        currencies: query.data ? query.data.filter((c) => c.isActivated) : [],
    };
};
