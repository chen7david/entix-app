import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@web/src/hooks/auth/useAuth";
import { message } from "antd";

const API_BASE = "/api/v1";

type SessionDTO = {
    id: string;
    organizationId: string;
    title: string;
    description: string | null;
    startTime: number;
    durationMinutes: number;
    status: "scheduled" | "completed" | "cancelled";
    seriesId: string | null;
    recurrenceRule: string | null;
    participants: {
        sessionId: string;
        memberId: string;
        member?: {
            user?: {
                id: string;
                name: string;
                email: string;
                image: string | null;
            }
        }
    }[];
};

export const useSchedule = (organizationId?: string, startDate?: number, endDate?: number) => {
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();
    
    const queryKey = ["schedule", organizationId, startDate, endDate];

    const { data: sessions, isLoading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!organizationId) return [];
            let url = `${API_BASE}/orgs/${organizationId}/schedule`;
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate.toString());
            if (endDate) params.append("endDate", endDate.toString());
            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch sessions");
            return res.json() as Promise<SessionDTO[]>;
        },
        enabled: !!organizationId && isAuthenticated,
    });

    const createSession = useMutation({
        mutationFn: async (payload: {
            title: string;
            description?: string;
            startTime: number;
            durationMinutes: number;
            memberIds: string[];
            recurrence?: { frequency: "weekly", count: number };
        }) => {
            const res = await fetch(`${API_BASE}/orgs/${organizationId}/schedule`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to create session");
            return res.json();
        },
        onSuccess: () => {
            message.success("Session(s) created successfully");
            queryClient.invalidateQueries({ queryKey: ["schedule", organizationId] });
        },
        onError: () => message.error("Failed to create session")
    });

    const updateSession = useMutation({
        mutationFn: async ({ sessionId, payload }: {
            sessionId: string;
            payload: {
                title: string;
                description?: string;
                startTime: number;
                durationMinutes: number;
                memberIds: string[];
                updateForward: boolean;
            }
        }) => {
            const res = await fetch(`${API_BASE}/orgs/${organizationId}/schedule/${sessionId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to update session");
            return res.json();
        },
        onSuccess: () => {
            message.success("Session updated successfully");
            queryClient.invalidateQueries({ queryKey: ["schedule", organizationId] });
        },
        onError: () => message.error("Failed to update session")
    });

    const deleteSession = useMutation({
        mutationFn: async ({ sessionId, deleteForward }: { sessionId: string; deleteForward: boolean }) => {
            const res = await fetch(`${API_BASE}/orgs/${organizationId}/schedule/${sessionId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deleteForward })
            });
            if (!res.ok) throw new Error("Failed to delete session");
            return res.json();
        },
        onSuccess: () => {
            message.success("Session deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["schedule", organizationId] });
        },
        onError: () => message.error("Failed to delete session")
    });

    return {
        sessions,
        isLoading,
        error,
        createSession,
        updateSession,
        deleteSession
    };
};
