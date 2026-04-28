import {
    keepPreviousData,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@web/src/features/auth";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_ANALYTICS_MS, QUERY_STALE_MS } from "@web/src/lib/query-config";
import { App } from "antd";

export type SessionDTO = {
    id: string;
    organizationId: string;
    lessonId: string;
    teacherId: string;
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

export type StudentEnrollmentSessionDTO = {
    sessionId: string;
    lessonTitle: string;
    startTime: string;
    endTime: string;
    teacherName: string;
    sessionStatus: "scheduled" | "completed" | "cancelled";
    enrollmentStatus: string;
};

export const useSchedule = (
    organizationId?: string,
    startDate?: number,
    endDate?: number,
    searchQuery?: string,
    direction: "next" | "prev" = "next"
) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();

    const queryKey = ["schedule", organizationId, startDate, endDate, searchQuery, direction];

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
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].schedule.$get({
                param: { organizationId },
                query: {
                    limit: 50,
                    startDate,
                    endDate,
                    cursor: pageParam,
                    search: searchQuery,
                    direction,
                },
            });
            return hcJson(res);
        },
        getNextPageParam: (lastPage: any) => lastPage.nextCursor ?? undefined,
        initialPageParam: undefined,
        enabled: !!organizationId && isAuthenticated,
        placeholderData: keepPreviousData,
        staleTime: QUERY_STALE_MS,
    });

    const sessions = (sessionsPages?.pages.flatMap((p: any) => p.items) || []) as SessionDTO[];

    const createSession = useMutation({
        mutationFn: async (payload: {
            lessonId: string;
            teacherId: string;
            title: string;
            description?: string;
            startTime: number;
            durationMinutes: number;
            userIds: string[];
            recurrence?: { frequency: "daily" | "weekly" | "biweekly" | "monthly"; count: number };
        }) => {
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].schedule.$post({
                param: { organizationId },
                json: payload,
            });
            return hcJson(res);
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
                lessonId: string;
                teacherId: string;
                title: string;
                description?: string | null;
                startTime: number;
                durationMinutes: number;
                userIds: string[];
                updateForward: boolean;
                status?: "scheduled" | "completed" | "cancelled";
            };
        }) => {
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].schedule[":sessionId"].$patch({
                param: { organizationId, sessionId },
                json: payload,
            });
            return hcJson(res);
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
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].schedule[
                ":sessionId"
            ].status.$patch({
                param: { organizationId, sessionId },
                json: payload,
            });
            return hcJson(res);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schedule", organizationId] });
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
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].schedule[":sessionId"].$delete({
                param: { organizationId, sessionId },
                json: { deleteForward },
            });
            return hcJson(res);
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
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].schedule[
                ":sessionId"
            ].attendances.$patch({
                param: { organizationId, sessionId },
                json: { attendances },
            });

            return hcJson(res);
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

            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].schedule.metrics.$get({
                param: { organizationId },
                query: { startDate, endDate },
            });
            return hcJson<{ total: number; completed: number; cancelled: number }>(res);
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

export function useMyEnrollments(organizationId?: string) {
    const { user, isAuthenticated } = useAuth();

    return useQuery({
        queryKey: ["myEnrollments", organizationId, user?.id],
        queryFn: async () => {
            if (!organizationId) return [];
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].enrollments.me.$get({
                param: { organizationId },
            });
            return hcJson<StudentEnrollmentSessionDTO[]>(res);
        },
        enabled: !!organizationId && !!user?.id && isAuthenticated,
        staleTime: QUERY_STALE_MS,
    });
}
