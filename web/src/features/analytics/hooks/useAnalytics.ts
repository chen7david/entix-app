import { API_V1 } from "@shared";
import { useQuery } from "@tanstack/react-query";
import { QUERY_STALE_ANALYTICS_MS } from "@web/src/lib/query-config";
import { parseApiError } from "@web/src/utils/api";
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
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate.toString());
            if (endDate) params.append("endDate", endDate.toString());
            params.append("tzOffset", tzOffset);

            const queryString = params.toString();
            const url = `${API_V1}/orgs/${organizationId}/analytics/sessions${queryString ? `?${queryString}` : ""}`;

            const res = await fetch(url);
            if (!res.ok) await parseApiError(res);
            return res.json();
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
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate.toString());
            if (endDate) params.append("endDate", endDate.toString());
            params.append("tzOffset", tzOffset);

            const queryString = params.toString();
            const url = `${API_V1}/orgs/${organizationId}/analytics/attendance${queryString ? `?${queryString}` : ""}`;

            const res = await fetch(url);
            if (!res.ok) await parseApiError(res);
            return res.json();
        },
        enabled: !!organizationId,
        staleTime: QUERY_STALE_ANALYTICS_MS,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });

    return {
        sessionTrends: sessionsQuery.data || [],
        isLoadingSessions: sessionsQuery.isLoading,
        sessionsError: sessionsQuery.error,

        attendanceTrends: attendanceQuery.data || [],
        isLoadingAttendance: attendanceQuery.isLoading,
        attendanceError: attendanceQuery.error,
    };
}
