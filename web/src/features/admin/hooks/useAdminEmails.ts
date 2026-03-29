import { useQuery } from "@tanstack/react-query";

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

export const useAdminEmails = () => {
    return useQuery<EmailListResponse>({
        queryKey: ["admin", "emails"],
        queryFn: async () => {
            const res = await fetch("/api/v1/admin/emails?limit=100", { credentials: "include" });
            if (!res.ok) throw new Error(`Failed to fetch emails: ${res.status}`);
            return res.json();
        },
    });
};
