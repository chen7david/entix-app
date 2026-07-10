import type { WalletAccountDTO } from "@shared";
import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { parseApiError } from "@web/src/utils/api";

export const useTreasuryBalance = () => {
    return useQuery<WalletAccountDTO[]>({
        queryKey: ["treasuryBalance"],
        queryFn: async () => {
            const api = getApiClient();
            const res = await api.api.v1.admin.finance.treasury.balance.$get();
            if (res.status === 404) return [];
            if (!res.ok) await parseApiError(res);
            const data = await res.json();
            return data.data ?? [];
        },
        staleTime: QUERY_STALE_MS,
    });
};
