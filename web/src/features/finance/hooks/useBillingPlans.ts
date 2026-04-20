import { API_V1 } from "@shared";
import type {
    BillingPlanDTO,
    BillingPlanPaginationInput,
    CreateBillingPlanInput,
    UpdateBillingPlanInput,
} from "@shared/schemas/dto/billing-plan.dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { parseApiError } from "@web/src/utils/api";
import { App } from "antd";

/**
 * Hook for listing organization billing plans with pagination and search.
 */
export const useBillingPlans = (orgId: string, query: Partial<BillingPlanPaginationInput> = {}) => {
    const { limit = 20, cursor, search } = query;

    return useQuery({
        queryKey: ["billing-plans", orgId, { limit, cursor, search }],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (cursor) params.append("cursor", cursor);
            params.append("limit", limit.toString());
            if (search) params.append("search", search);

            const res = await fetch(
                `${API_V1}/orgs/${orgId}/finance/billing-plans?${params.toString()}`
            );
            if (!res.ok) await parseApiError(res);
            const { data, nextCursor } = await res.json();
            return { data: data as BillingPlanDTO[], nextCursor: nextCursor as string | null };
        },
        enabled: !!orgId,
        staleTime: QUERY_STALE_MS,
    });
};

/**
 * Hook for creating/updating/deleting billing plans.
 */
export const useBillingPlanActions = (orgId: string) => {
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    const createMutation = useMutation({
        mutationFn: async (input: CreateBillingPlanInput) => {
            const res = await fetch(`${API_V1}/orgs/${orgId}/finance/billing-plans`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });
            if (!res.ok) await parseApiError(res);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing-plans", orgId] });
            notification.success({
                message: "Plan Created",
                description: "New billing plan created successfully",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({
            planId,
            updates,
        }: {
            planId: string;
            updates: UpdateBillingPlanInput;
        }) => {
            const res = await fetch(`${API_V1}/orgs/${orgId}/finance/billing-plans/${planId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (!res.ok) await parseApiError(res);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing-plans", orgId] });
            notification.success({
                message: "Plan Updated",
                description: "Billing plan updated successfully",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (planId: string) => {
            const res = await fetch(`${API_V1}/orgs/${orgId}/finance/billing-plans/${planId}`, {
                method: "DELETE",
            });
            if (!res.ok) await parseApiError(res);
            return res.json();
        },
        onMutate: async (planId) => {
            // Optimistic removal for better UX
            await queryClient.cancelQueries({ queryKey: ["billing-plans", orgId] });
            const previousPlans = queryClient.getQueryData(["billing-plans", orgId]);

            queryClient.setQueryData(["billing-plans", orgId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    data: old.data.filter((p: BillingPlanDTO) => p.id !== planId),
                };
            });

            return { previousPlans };
        },
        onError: (_err, _planId, context) => {
            if (context?.previousPlans) {
                queryClient.setQueryData(["billing-plans", orgId], context.previousPlans);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing-plans", orgId] });
            notification.success({
                message: "Plan Deleted",
                description: "Billing plan removed from organization",
            });
        },
    });

    return {
        createPlan: createMutation,
        updatePlan: updateMutation,
        deletePlan: deleteMutation,
    };
};
