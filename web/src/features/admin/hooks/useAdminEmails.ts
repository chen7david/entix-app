import { useQuery } from "@tanstack/react-query";
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
            const url = new URL("/api/v1/admin/emails", window.location.origin);
            if (options?.cursor) url.searchParams.set("cursor", options.cursor);
            if (options?.limit) url.searchParams.set("limit", options.limit.toString());
            if (options?.direction) url.searchParams.set("direction", options.direction);

            const res = await fetch(url.toString(), { credentials: "include" });
            if (!res.ok) throw new Error(`Failed to fetch emails: ${res.status}`);
            return res.json();
        },
        staleTime: QUERY_STALE_MS,
    });
};
