import { API_V1 } from "@shared";
import {
    keepPreviousData,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@web/src/features/auth";
import { QUERY_STALE_ANALYTICS_MS, QUERY_STALE_MS } from "@web/src/lib/query-config";
import { App } from "antd";

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
    attendances: {
        sessionId: string;
        organizationId: string;
        userId: string;
        joinedAt?: number;
        absent?: boolean;
        absenceReason?: string | null;
        notes?: string | null;
        paidAt?: number | null;
        user?: {
            id: string;
            name: string;
            email: string;
            image: string | null;
        };
    }[];
};

export const useSchedule = (
    organizationId?: string,
    startDate?: number,
    endDate?: number,
    searchQuery?: string
) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();

    const queryKey = ["schedule", organizationId, startDate, endDate, searchQuery];

    const {
        data: sessionsPages,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey,
        queryFn: async ({ pageParam = undefined }) => {
            if (!organizationId) return { items: [], nextCursor: null, prevCursor: null };
            let url = `${API_V1}/orgs/${organizationId}/schedule`;
            const params = new URLSearchParams({ limit: "50" }); // Fetch generously for calendar maps natively
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
        placeholderData: keepPreviousData,
        staleTime: QUERY_STALE_MS,
    });

    // Safely flatten infinite scroll generic arrays mapping identically to previous UI structures natively.
    const sessions = (sessionsPages?.pages.flatMap((p: any) => p.items) || []) as SessionDTO[];

    const createSession = useMutation({
        mutationFn: async (payload: {
            title: string;
            description?: string;
            startTime: number;
            durationMinutes: number;
            userIds: string[];
            recurrence?: { frequency: "daily" | "weekly" | "biweekly" | "monthly"; count: number };
        }) => {
            const res = await fetch(`${API_V1}/orgs/${organizationId}/schedule`, {
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
            notification.success({ message: "Session(s) created successfully" });
            queryClient.invalidateQueries({ queryKey: ["schedule", organizationId] });
        },
        onError: (err: any) =>
            notification.error({
                message: "Create Failed",
                description: err.message || "Failed to create session",
            }),
    });

    const updateSession = useMutation({
        mutationFn: async ({
            sessionId,
            payload,
        }: {
            sessionId: string;
            payload: {
                title: string;
                description?: string | null;
                startTime: number;
                durationMinutes: number;
                userIds: string[];
                updateForward: boolean;
                status?: "scheduled" | "completed" | "cancelled";
            };
        }) => {
            const res = await fetch(`${API_V1}/orgs/${organizationId}/schedule/${sessionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to update session");
            return res.json();
        },
        onSuccess: () => {
            notification.success({ message: "Session updated successfully" });
            queryClient.invalidateQueries({ queryKey: ["schedule", organizationId] });
        },
        onError: (err: any) =>
            notification.error({
                message: "Update Failed",
                description: err.message || "Failed to update session",
            }),
    });

    const updateSessionStatus = useMutation({
        mutationFn: async ({
            sessionId,
            payload,
        }: {
            sessionId: string;
            payload: { status: "scheduled" | "completed" | "cancelled" };
        }) => {
            const res = await fetch(
                `${API_V1}/orgs/${organizationId}/schedule/${sessionId}/status`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );
            if (!res.ok) throw new Error("Failed to update status");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schedule", organizationId] });
            // Prefix-match invalidation covers all date-range variants of scheduleMetrics
            queryClient.invalidateQueries({ queryKey: ["scheduleMetrics", organizationId] });
            notification.success({
                message: "Status Updated",
                description: "Session status has been updated.",
            });
        },
        onError: (err: any) =>
            notification.error({
                message: "Status Update Failed",
                description: err.message || "Failed to update status",
            }),
    });

    const deleteSession = useMutation({
        mutationFn: async ({
            sessionId,
            deleteForward,
        }: {
            sessionId: string;
            deleteForward: boolean;
        }) => {
            const res = await fetch(`${API_V1}/orgs/${organizationId}/schedule/${sessionId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deleteForward }),
            });
            if (!res.ok) throw new Error("Failed to delete session");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schedule", organizationId] });
            notification.success({ message: "Session deleted securely" });
        },
        onError: (err: any) => {
            notification.error({
                message: "Delete Failed",
                description: err.message || "Failed to delete session",
            });
        },
    });

    const updateAttendance = useMutation({
        mutationFn: async ({
            sessionId,
            attendances,
        }: {
            sessionId: string;
            attendances: {
                userId: string;
                absent: boolean;
                absenceReason?: string | null;
                notes?: string | null;
            }[];
        }) => {
            const res = await fetch(
                `${API_V1}/orgs/${organizationId}/schedule/${sessionId}/attendances`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ attendances }),
                }
            );

            if (!res.ok) throw new Error("Failed to update participation states");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schedule", organizationId] });
            notification.success({ message: "Attendance maps saved properly" });
        },
        onError: (err: any) => {
            notification.error({
                message: "Attendance Save Failed",
                description: err.message || "Attendance save failed",
            });
        },
    });

    return {
        sessions,
        isLoading,
        error,
        createSession,
        updateSession,
        updateSessionStatus,
        deleteSession,
        updateAttendance,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    };
};

export function useScheduleMetrics(organizationId?: string, startDate?: number, endDate?: number) {
    const {
        data: metrics,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["scheduleMetrics", organizationId, startDate, endDate],
        queryFn: async () => {
            if (!organizationId) return { total: 0, completed: 0, cancelled: 0 };

            const params = new URLSearchParams();
            if (startDate) params.set("startDate", startDate.toString());
            if (endDate) params.set("endDate", endDate.toString());

            const res = await fetch(
                `${API_V1}/orgs/${organizationId}/schedule/metrics?${params.toString()}`
            );
            if (!res.ok) throw new Error("Failed to fetch schedule metrics");
            return res.json() as Promise<{ total: number; completed: number; cancelled: number }>;
        },
        enabled: !!organizationId,
        refetchOnWindowFocus: false,
        staleTime: QUERY_STALE_ANALYTICS_MS,
    });

    return {
        metrics,
        isLoading,
        error,
    };
}
