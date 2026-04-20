import { API_V1, type WalletSummaryDTO } from "@shared";
import { useQuery } from "@tanstack/react-query";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { parseApiError } from "@web/src/utils/api";

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
            if (ownerType === "user" && !orgId)
                throw new Error("Organization ID required for member wallets");

            const url =
                ownerType === "org"
                    ? `${API_V1}/orgs/${id}/finance/summary`
                    : `${API_V1}/orgs/${orgId}/members/${id}/wallet/summary`;

            const res = await fetch(url);
            if (!res.ok) await parseApiError(res);
            return (await res.json()) as WalletSummaryResponse;
        },
        select: (res) => res?.data,
        staleTime: QUERY_STALE_MS,
        enabled: ownerType === "org" ? !!id : !!id && !!orgId,
    });
};
