import { API_V1 } from "@shared";
import type { MemberBillingPlanDTO } from "@shared/schemas/dto/billing-plan.dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { parseApiError } from "@web/src/utils/api";
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
            const res = await fetch(`${API_V1}/orgs/${orgId}/members/${userId}/billing-plans`);
            if (!res.ok) await parseApiError(res);
            const { data } = await res.json();
            return data as MemberBillingPlanDTO[];
        },
        enabled: !!orgId && !!userId,
        staleTime: QUERY_STALE_MS,
    });

    const assignOrReplaceMutation = useMutation({
        mutationFn: async ({ planId, currencyId }: { planId: string; currencyId: string }) => {
            // Check if there's already an assignment for this currency to decide POST (assign) or PUT (replace)
            const existing = assignments?.find((a) => a.currencyId === currencyId);
            const method = existing ? "PUT" : "POST";

            const res = await fetch(`${API_V1}/orgs/${orgId}/members/${userId}/billing-plans`, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId, userId }),
            });

            if (!res.ok) await parseApiError(res);
            return res.json();
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
