import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@web/src/hooks/auth/useAuth";
import { message } from "antd";

const API_BASE = "/api/v1";

export type SessionDTO = {
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
        joinedAt?: number;
        absent?: boolean;
        absenceReason?: string | null;
        notes?: string | null;
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

export const useSchedule = (organizationId?: string, startDate?: number, endDate?: number, searchQuery?: string) => {
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();
    
    const queryKey = ["schedule", organizationId, startDate, endDate, searchQuery];

    const { 
        data: sessionsPages, 
        isLoading, 
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey,
        queryFn: async ({ pageParam = undefined }) => {
            if (!organizationId) return { items: [], nextCursor: null, prevCursor: null };
            let url = `${API_BASE}/orgs/${organizationId}/schedule`;
            const params = new URLSearchParams({ limit: '50' }); // Fetch generously for calendar maps natively
            if (startDate) params.append("startDate", startDate.toString());
            if (endDate) params.append("endDate", endDate.toString());
            if (pageParam) params.append("cursor", pageParam);
            if (searchQuery) params.append("search", searchQuery);
            
            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch sessions");
            return res.json();
        },
        getNextPageParam: (lastPage: any) => lastPage.nextCursor ?? undefined,
        initialPageParam: undefined,
        enabled: !!organizationId && isAuthenticated,
    });
    
    // Safely flatten infinite scroll generic arrays mapping identically to previous UI structures natively.
    const sessions = (sessionsPages?.pages.flatMap((p: any) => p.items) || []) as SessionDTO[];

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
                title: string, 
                description?: string | null, 
                startTime: number, 
                durationMinutes: number, 
                memberIds: string[], 
                updateForward: boolean,
                status?: "scheduled" | "completed" | "cancelled"
            } 
        }) => {
            const res = await fetch(`${API_BASE}/orgs/${organizationId}/schedule/${sessionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
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
            queryClient.invalidateQueries({ queryKey: ["schedule", organizationId] });
            message.success("Session deleted securely");
        },
        onError: (err: any) => {
            message.error(err.message || "Failed to delete session");
        }
    });

    const updateParticipantAttendance = useMutation({
        mutationFn: async ({ sessionId, participants }: { 
            sessionId: string; 
            participants: { memberId: string, absent: boolean, absenceReason?: string | null, notes?: string | null }[]
        }) => {
            const res = await fetch(`${API_BASE}/orgs/${organizationId}/schedule/${sessionId}/participants`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ participants })
            });

            if (!res.ok) throw new Error("Failed to update participation states");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schedule", organizationId] });
            message.success("Attendance maps saved properly");
        },
        onError: (err: any) => {
            message.error(err.message || "Attendance save failed");
        }
    });

    return {
        sessions,
        isLoading,
        error,
        createSession,
        updateSession,
        deleteSession,
        updateParticipantAttendance,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    };
}

export function useScheduleMetrics(organizationId?: string, startDate?: number, endDate?: number) {
    const { data: metrics, isLoading, error } = useQuery({
        queryKey: ["scheduleMetrics", organizationId, startDate, endDate],
        queryFn: async () => {
            if (!organizationId) return { total: 0, completed: 0, cancelled: 0 };
            
            const params = new URLSearchParams();
            if (startDate) params.set("startDate", startDate.toString());
            if (endDate) params.set("endDate", endDate.toString());

            const res = await fetch(`${API_BASE}/orgs/${organizationId}/schedule/metrics?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch schedule metrics");
            return res.json() as Promise<{ total: number, completed: number, cancelled: number }>;
        },
        enabled: !!organizationId,
        refetchOnWindowFocus: false,
    });

    return {
        metrics,
        isLoading,
        error
    };
};
