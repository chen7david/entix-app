import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_ANALYTICS_MS } from "@web/src/lib/query-config";
import { DateUtils } from "@web/src/utils/date";

export interface SessionTrend {
    date: string;
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
}

export interface AttendanceTrend {
    date: string;
    totalExpected: number;
    present: number;
    absent: number;
}

const USER_TZ_OFFSET =
    DateUtils.getTimezoneOffset(Intl.DateTimeFormat().resolvedOptions().timeZone) || "+00:00";

export function useAnalytics(organizationId?: string, startDate?: number, endDate?: number) {
    const tzOffset = USER_TZ_OFFSET;

    const sessionsQuery = useQuery({
        queryKey: [
            "orgTracker",
            organizationId,
            "analytics",
            "sessions",
            startDate,
            endDate,
            tzOffset,
        ],
        queryFn: async (): Promise<SessionTrend[]> => {
            if (!organizationId) return [];
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].analytics.sessions.$get({
                param: { organizationId },
                query: { startDate, endDate, tzOffset },
            });
            return hcJson<SessionTrend[]>(res);
        },
        enabled: !!organizationId,
        staleTime: QUERY_STALE_ANALYTICS_MS,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });

    const attendanceQuery = useQuery({
        queryKey: [
            "orgTracker",
            organizationId,
            "analytics",
            "attendance",
            startDate,
            endDate,
            tzOffset,
        ],
        queryFn: async (): Promise<AttendanceTrend[]> => {
            if (!organizationId) return [];
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].analytics.attendance.$get({
                param: { organizationId },
                query: { startDate, endDate, tzOffset },
            });
            return hcJson<AttendanceTrend[]>(res);
        },
        enabled: !!organizationId,
        staleTime: QUERY_STALE_ANALYTICS_MS,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });

    return {
        sessionTrends: sessionsQuery.data || [],
        isLoadingSessions: sessionsQuery.isLoading,
        isFetchingSessions: sessionsQuery.isFetching,
        sessionsUpdatedAt: sessionsQuery.dataUpdatedAt,
        refetchSessions: sessionsQuery.refetch,
        sessionsError: sessionsQuery.error,

        attendanceTrends: attendanceQuery.data || [],
        isLoadingAttendance: attendanceQuery.isLoading,
        isFetchingAttendance: attendanceQuery.isFetching,
        attendanceUpdatedAt: attendanceQuery.dataUpdatedAt,
        refetchAttendance: attendanceQuery.refetch,
        attendanceError: attendanceQuery.error,
    };
}
