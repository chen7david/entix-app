import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";

export type AuditLogFilters = {
    organizationId?: string;
    severity?: "info" | "warning" | "error" | "critical";
    eventType?: string;
    unresolvedOnly?: boolean;
    cursor?: string;
    limit?: number;
    direction?: "next" | "prev";
};

export const useAdminAuditLogs = (filters: AuditLogFilters) => {
    return useQuery({
        queryKey: ["admin", "audit-logs", filters],
        queryFn: async () => {
            const api = getApiClient();
            const res = await api.api.v1.admin["audit-logs"].$get({
                query: {
                    organizationId: filters.organizationId,
                    severity: filters.severity,
                    eventType: filters.eventType,
                    unresolvedOnly: filters.unresolvedOnly,
                    cursor: filters.cursor,
                    limit: filters.limit,
                    direction: filters.direction,
                },
            });
            return hcJson<{
                items: any[];
                nextCursor: string | null;
                prevCursor: string | null;
            }>(res);
        },
        staleTime: QUERY_STALE_MS,
    });
};

export const useAcknowledgeAuditLog = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const api = getApiClient();
            const res = await api.api.v1.admin["audit-logs"][":id"].acknowledge.$post({
                param: { id },
            });
            return hcJson(res);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
        },
    });
};

export type RequeuePayload = {
    eventId: string;
    organizationId: string;
};

export const useRequeueFailedPayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: RequeuePayload) => {
            const api = getApiClient();
            const res = await api.api.v1.admin["audit-logs"]["requeue-payment"].$post({
                json: payload,
            });
            return hcJson<{ status: "queued" }>(res);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
        },
    });
};
