import { API_V1, type WalletAccountDTO } from "@shared";
import { useQuery } from "@tanstack/react-query";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { parseApiError } from "@web/src/utils/api";

export const useTreasuryBalance = () => {
    return useQuery<WalletAccountDTO[]>({
        queryKey: ["treasuryBalance"],
        queryFn: async () => {
            const res = await fetch(`${API_V1}/admin/finance/treasury/balance`);
            if (res.status === 404) return [];
            if (!res.ok) await parseApiError(res);
            const data = await res.json();
            return data.data ?? [];
        },
        staleTime: QUERY_STALE_MS,
    });
};
