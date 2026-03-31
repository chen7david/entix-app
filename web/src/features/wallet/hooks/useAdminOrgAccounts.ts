import { API_V1 } from "@shared";
import { useQuery } from "@tanstack/react-query";
import type { WalletAccount } from "./useWalletBalance";

export const useAdminOrgAccounts = (organizationId?: string) => {
    return useQuery<{ accounts: WalletAccount[] }>({
        queryKey: ["adminOrgAccounts", organizationId],
        queryFn: async () => {
            if (!organizationId) throw new Error("Organization ID required");
            const res = await fetch(`${API_V1}/orgs/${organizationId}/finance/accounts/admin`);
            if (!res.ok) throw new Error("Failed to fetch org accounts");
            return res.json();
        },
        enabled: !!organizationId,
    });
};
