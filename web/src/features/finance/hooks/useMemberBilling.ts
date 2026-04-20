import type { MemberBillingPlanDTO } from "@shared/schemas/dto/billing-plan.dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { App } from "antd";

/**
 * Hook for managing and listing a specific member's billing plan assignments.
 */
export const useMemberBilling = (orgId: string, userId: string) => {
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    const queryKey = ["member-billing", orgId, userId];

    const { data: assignments, isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].members[":userId"][
                "billing-plans"
            ].$get({
                param: { organizationId: orgId, userId },
            });
            const body = await hcJson<{ data: MemberBillingPlanDTO[] }>(res);
            return body.data;
        },
        enabled: !!orgId && !!userId,
        staleTime: QUERY_STALE_MS,
    });

    const assignOrReplaceMutation = useMutation({
        mutationFn: async ({ planId, currencyId }: { planId: string; currencyId: string }) => {
            const existing = assignments?.find((a) => a.currencyId === currencyId);
            const api = getApiClient();
            const res = existing
                ? await api.api.v1.orgs[":organizationId"].members[":userId"]["billing-plans"].$put(
                      {
                          param: { organizationId: orgId, userId },
                          json: { planId, userId },
                      }
                  )
                : await api.api.v1.orgs[":organizationId"].members[":userId"][
                      "billing-plans"
                  ].$post({
                      param: { organizationId: orgId, userId },
                      json: { planId, userId },
                  });

            return hcJson(res);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey });
            notification.success({
                message: "Billing Plan Updated",
                description: `Member billing plan updated for currency ${variables.currencyId}`,
            });
        },
    });

    return {
        assignments,
        isLoading,
        updatePlan: assignOrReplaceMutation,
    };
};
