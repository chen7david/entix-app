import type { WalletSummaryDTO } from "@shared";
import { useQueries } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { queryKeys } from "@web/src/lib/query-keys";

type WalletSummaryResponse = {
    data: WalletSummaryDTO;
};

/**
 * Parallel member wallet summaries for session attendance rows.
 * Query keys align with `useWalletBalance(userId, "user", organizationId)`.
 */
export function useSessionStudentWallets(organizationId: string | undefined, userIds: string[]) {
    return useQueries({
        queries: userIds.map((userId) => ({
            queryKey: queryKeys.wallet.balance(userId, "user", organizationId),
            queryFn: async () => {
                if (!organizationId) return null;
                const api = getApiClient();
                const res = await api.api.v1.orgs[":organizationId"].members[
                    ":userId"
                ].wallet.summary.$get({
                    param: { organizationId, userId },
                });
                return hcJson<WalletSummaryResponse>(res);
            },
            enabled: !!organizationId && !!userId,
            staleTime: QUERY_STALE_MS,
            select: (res: WalletSummaryResponse | null) => res?.data ?? null,
        })),
    });
}
