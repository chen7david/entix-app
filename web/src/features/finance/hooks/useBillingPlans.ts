import type {
    BillingPlanDTO,
    BillingPlanPaginationInput,
    CreateBillingPlanInput,
    UpdateBillingPlanInput,
} from "@shared/schemas/dto/billing-plan.dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { App } from "antd";

/**
 * Hook for listing organization billing plans with pagination and search.
 */
export const useBillingPlans = (orgId: string, query: Partial<BillingPlanPaginationInput> = {}) => {
    const { limit = 20, cursor, search } = query;

    return useQuery({
        queryKey: ["billing-plans", orgId, { limit, cursor, search }],
        queryFn: async () => {
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].finance["billing-plans"].$get({
                param: { organizationId: orgId },
                query: { limit, cursor, search },
            });
            const { data, nextCursor } = await hcJson<{
                data: BillingPlanDTO[];
                nextCursor: string | null;
            }>(res);
            return { data, nextCursor };
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
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].finance["billing-plans"].$post({
                param: { organizationId: orgId },
                json: input,
            });
            return hcJson(res);
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
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].finance["billing-plans"][
                ":planId"
            ].$patch({
                param: { organizationId: orgId, planId },
                json: updates,
            });
            return hcJson(res);
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
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].finance["billing-plans"][
                ":planId"
            ].$delete({
                param: { organizationId: orgId, planId },
            });
            return hcJson(res);
        },
        onMutate: async (planId) => {
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
