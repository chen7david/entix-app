import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CurrencyWithStatus } from "@web/src/features/finance/hooks/useOrgCurrencies";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";

export const useAdminOrgCurrencies = (orgId?: string) => {
    return useQuery({
        queryKey: ["admin", "orgCurrencies", orgId],
        queryFn: async () => {
            if (!orgId) throw new Error("Organization ID required");
            const api = getApiClient();
            const res = await api.api.v1.admin.finance.orgs[":organizationId"].currencies.$get({
                param: { organizationId: orgId },
            });
            return hcJson<{ data: CurrencyWithStatus[] }>(res);
        },
        select: (res) => res?.data,
        enabled: !!orgId,
        staleTime: QUERY_STALE_MS,
        gcTime: QUERY_STALE_MS,
    });
};

export const useAdminActivateCurrency = (orgId?: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (currencyId: string) => {
            if (!orgId) throw new Error("Organization ID required");
            const api = getApiClient();
            const res = await api.api.v1.admin.finance.orgs[
                ":organizationId"
            ].currencies.activate.$post({
                param: { organizationId: orgId },
                json: { currencyId },
            });
            return hcJson(res);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "orgCurrencies", orgId] });
        },
    });
};
