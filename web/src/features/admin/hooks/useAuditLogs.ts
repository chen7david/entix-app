import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
            const url = new URL("/api/v1/admin/audit-logs", window.location.origin);
            if (filters.organizationId)
                url.searchParams.set("organizationId", filters.organizationId);
            if (filters.severity) url.searchParams.set("severity", filters.severity);
            if (filters.eventType) url.searchParams.set("eventType", filters.eventType);
            if (filters.unresolvedOnly !== undefined)
                url.searchParams.set("unresolvedOnly", filters.unresolvedOnly.toString());
            if (filters.cursor) url.searchParams.set("cursor", filters.cursor);
            if (filters.limit) url.searchParams.set("limit", filters.limit.toString());
            if (filters.direction) url.searchParams.set("direction", filters.direction);

            const response = await fetch(url.toString());
            if (!response.ok) {
                const error = await response
                    .json()
                    .catch(() => ({ message: "Failed to fetch audit logs" }));
                throw new Error(error.message || "Failed to fetch audit logs");
            }
            return response.json() as Promise<{
                items: any[];
                nextCursor: string | null;
                prevCursor: string | null;
            }>;
        },
        staleTime: QUERY_STALE_MS,
    });
};

export const useAcknowledgeAuditLog = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/v1/admin/audit-logs/${id}/acknowledge`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                const error = await response
                    .json()
                    .catch(() => ({ message: "Failed to acknowledge audit log" }));
                throw new Error(error.message || "Failed to acknowledge audit log");
            }
            return response.json();
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
            const response = await fetch("/api/v1/admin/audit-logs/requeue-payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const error = await response
                    .json()
                    .catch(() => ({ message: "Failed to requeue payment" }));
                throw new Error(error.message || "Failed to requeue payment");
            }
            return response.json() as Promise<{ status: "queued" }>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
        },
    });
};
