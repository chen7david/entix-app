import { API_V1, type WalletAccountDTO } from "@shared";
import { useQuery } from "@tanstack/react-query";
import { parseApiError } from "@web/src/utils/api";

export const useAdminOrgAccounts = (organizationId?: string) => {
    return useQuery({
        queryKey: ["adminOrgAccounts", organizationId || "all"],
        queryFn: async () => {
            const url = organizationId
                ? `${API_V1}/admin/finance/orgs/${organizationId}/accounts`
                : `${API_V1}/admin/finance/accounts/managed`;
            const res = await fetch(url);
            if (!res.ok) await parseApiError(res);
            return (await res.json()) as { data: WalletAccountDTO[] };
        },
        select: (res) => res?.data,
    });
};
