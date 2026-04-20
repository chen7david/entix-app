import type { WalletSummaryDTO } from "@shared";
import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";

type WalletSummaryResponse = {
    data: WalletSummaryDTO;
};

export const useWalletBalance = (
    id?: string,
    ownerType: "user" | "org" = "org",
    orgId?: string
) => {
    return useQuery({
        queryKey: ["walletBalance", id, ownerType, orgId],
        queryFn: async () => {
            if (!id) throw new Error("ID required");

            const api = getApiClient();

            if (ownerType === "org") {
                const res = await api.api.v1.orgs[":organizationId"].finance.summary.$get({
                    param: { organizationId: id },
                });
                return hcJson<WalletSummaryResponse>(res);
            }

            if (!orgId) throw new Error("Organization ID required for member wallets");
            const res = await api.api.v1.orgs[":organizationId"].members[
                ":userId"
            ].wallet.summary.$get({
                param: { organizationId: orgId, userId: id },
            });
            return hcJson<WalletSummaryResponse>(res);
        },
        select: (res) => res?.data,
        staleTime: QUERY_STALE_MS,
        enabled: ownerType === "org" ? !!id : !!id && !!orgId,
    });
};
