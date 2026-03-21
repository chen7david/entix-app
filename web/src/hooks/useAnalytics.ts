import { useQuery } from '@tanstack/react-query';
const API_BASE = "/api/v1";

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

export function useAnalytics(
    organizationId?: string,
    startDate?: number,
    endDate?: number
) {

    const sessionsQuery = useQuery({
        queryKey: ['orgTracker', organizationId, 'analytics', 'sessions', startDate, endDate],
        queryFn: async (): Promise<SessionTrend[]> => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate.toString());
            if (endDate) params.append('endDate', endDate.toString());
            
            const queryString = params.toString();
            const url = `${API_BASE}/orgs/${organizationId}/analytics/sessions${queryString ? `?${queryString}` : ''}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch session analytics');
            return res.json();
        },
        enabled: !!organizationId,
    });

    const attendanceQuery = useQuery({
        queryKey: ['orgTracker', organizationId, 'analytics', 'attendance', startDate, endDate],
        queryFn: async (): Promise<AttendanceTrend[]> => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate.toString());
            if (endDate) params.append('endDate', endDate.toString());
            
            const queryString = params.toString();
            const url = `${API_BASE}/orgs/${organizationId}/analytics/attendance${queryString ? `?${queryString}` : ''}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch attendance analytics');
            return res.json();
        },
        enabled: !!organizationId,
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
