import { API_V1 } from "@shared";
import { useQuery } from "@tanstack/react-query";
import { parseApiError } from "@web/src/utils/api";
import type { WalletAccount } from "./useWalletBalance";

export const useAdminOrgAccounts = (organizationId?: string) => {
    return useQuery({
        queryKey: ["adminOrgAccounts", organizationId],
        queryFn: async () => {
            if (!organizationId) throw new Error("Organization ID required");
            const res = await fetch(`${API_V1}/admin/finance/orgs/${organizationId}/accounts`);
            if (!res.ok) await parseApiError(res);
            return (await res.json()) as { data: WalletAccount[] };
        },
        select: (res) => res?.data,
        enabled: !!organizationId,
    });
};
