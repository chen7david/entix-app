import type { WalletAccountDTO } from "@shared";
import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";

export const useAdminOrgAccounts = (organizationId?: string) => {
    return useQuery({
        queryKey: ["adminOrgAccounts", organizationId || "all"],
        queryFn: async () => {
            const api = getApiClient();
            const res = organizationId
                ? await api.api.v1.admin.finance.orgs[":organizationId"].accounts.$get({
                      param: { organizationId },
                  })
                : await api.api.v1.admin.finance.accounts.managed.$get();
            return hcJson<{ data: WalletAccountDTO[] }>(res);
        },
        select: (res) => res?.data,
        staleTime: QUERY_STALE_MS,
    });
};
