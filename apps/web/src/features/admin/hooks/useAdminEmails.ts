import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";

export type EmailEvent =
    | "sent"
    | "delivered"
    | "delivery_delayed"
    | "complained"
    | "bounced"
    | "opened"
    | "clicked"
    | null;

export interface EmailRow {
    id: string;
    to: string[] | null;
    from: string;
    subject: string | null;
    created_at: string;
    last_event: EmailEvent;
    scheduled_at: string | null;
}

export interface EmailListResponse {
    object: "list";
    data: EmailRow[];
    has_more: boolean;
}

export const useAdminEmails = (options?: {
    cursor?: string;
    limit?: number;
    direction?: "next" | "prev";
}) => {
    return useQuery<{
        items: EmailRow[];
        nextCursor: string | null;
        prevCursor: string | null;
    }>({
        queryKey: ["admin", "emails", options?.cursor, options?.limit, options?.direction],
        queryFn: async () => {
            const api = getApiClient();
            const res = await api.api.v1.admin.emails.$get({
                query: {
                    cursor: options?.cursor,
                    limit: options?.limit,
                    direction: options?.direction,
                },
            });
            return hcJson(res);
        },
        staleTime: QUERY_STALE_MS,
    });
};
