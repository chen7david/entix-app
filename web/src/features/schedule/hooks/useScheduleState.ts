import { useDebouncedValue } from "@tanstack/react-pacer";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import { DateUtils } from "@web/src/utils/date";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import type { SessionSubmitPayload } from "../components/SessionDetailsDrawer";
import { type SessionDTO, useSchedule, useScheduleMetrics } from "./useSchedule";

export type TimelineFilter = "All" | "Upcoming" | "Past" | "Next 5 Hours" | "Last 5 Hours";

export const useScheduleState = (organizationId?: string) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const defaultStart = DateUtils.startOf("day");
    const defaultEnd = DateUtils.endOf("day");

    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const queryStart = startDateParam ? parseInt(startDateParam, 10) : defaultStart;
    const queryEnd = endDateParam ? parseInt(endDateParam, 10) : defaultEnd;

    // Sync defaults to URL
    useEffect(() => {
        if (!startDateParam || !endDateParam) {
            const params = new URLSearchParams(searchParams);
            params.set("startDate", queryStart.toString());
            params.set("endDate", queryEnd.toString());
            setSearchParams(params, { replace: true });
        }
    }, [startDateParam, endDateParam, searchParams, setSearchParams, queryStart, queryEnd]);

    // Search logic
    const [localSearch, setLocalSearch] = useState(searchParams.get("q") || "");
    const [debouncedSearch, searchControl] = useDebouncedValue(
        localSearch,
        { wait: UI_CONSTANTS.DEBOUNCE.SEARCH_TABLE },
        (state) => ({ isPending: state.isPending })
    );

    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (debouncedSearch) params.set("q", debouncedSearch);
        else params.delete("q");
        setSearchParams(params, { replace: true });
    }, [debouncedSearch, searchParams, setSearchParams]);

    // Timeline filtering
    const [timeline, setTimeline] = useState<TimelineFilter>("Upcoming");

    // Data fetching
    const { metrics } = useScheduleMetrics(organizationId, queryStart, queryEnd);
    const {
        sessions,
        isLoading,
        error,
        createSession,
        updateSession,
        updateSessionStatus,
        deleteSession,
        updateAttendance,
        issueSessionMeetingToken,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useSchedule(organizationId, queryStart, queryEnd, debouncedSearch);

    // Derived Display Logic — always sorted ascending by start time (next session first)
    let displaySessions = [...(sessions || [])].sort((a, b) => a.startTime - b.startTime);
    const now = Date.now();
    if (timeline === "Upcoming")
        displaySessions = displaySessions.filter((s) => s.startTime >= now);
    else if (timeline === "Past")
        displaySessions = displaySessions.filter((s) => s.startTime < now);
    else if (timeline === "Next 5 Hours")
        displaySessions = displaySessions.filter(
            (s) => s.startTime >= now && s.startTime <= now + 5 * 3600000
        );
    else if (timeline === "Last 5 Hours")
        displaySessions = displaySessions.filter(
            (s) => s.startTime < now && s.startTime >= now - 5 * 3600000
        );

    // Range Handlers
    const handleRangeChange = (dates: any) => {
        const params = new URLSearchParams(searchParams);
        if (dates?.[0] && dates[1]) {
            params.set("startDate", DateUtils.startOf("day", dates[0]).toString());
            params.set("endDate", DateUtils.endOf("day", dates[1]).toString());
        } else {
            params.delete("startDate");
            params.delete("endDate");
        }
        setSearchParams(params, { replace: true });
    };

    const handleReset = () => {
        setLocalSearch("");
        setTimeline("Upcoming");
        const params = new URLSearchParams();
        params.set("startDate", defaultStart.toString());
        params.set("endDate", defaultEnd.toString());
        setSearchParams(params, { replace: true });
    };

    // Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<any>(null);

    const handleCreate = () => {
        setSelectedSession(null);
        setDrawerOpen(true);
    };

    const handleEdit = (session: any) => {
        setSelectedSession(session);
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
    };

    const [activeVideoMeeting, setActiveVideoMeeting] = useState<{
        token: string;
        title: string;
    } | null>(null);

    const openSessionVideo = async (session: SessionDTO) => {
        try {
            const data = await issueSessionMeetingToken.mutateAsync({ sessionId: session.id });
            setActiveVideoMeeting({ token: data.data.token, title: session.title });
        } catch {
            /* useSchedule mutation onError already surfaces a notification */
        }
    };

    const closeSessionVideo = () => setActiveVideoMeeting(null);

    const handleSave = async (payload: SessionSubmitPayload) => {
        if (selectedSession) {
            await updateSession.mutateAsync({
                sessionId: selectedSession.id,
                payload: {
                    ...payload,
                    updateForward: payload.updateForward ?? false,
                },
            });
        } else {
            await createSession.mutateAsync(payload);
        }
        setDrawerOpen(false);
    };

    return {
        // State
        queryStart,
        queryEnd,
        localSearch,
        setLocalSearch,
        searchControl,
        timeline,
        setTimeline,
        drawerOpen,
        selectedSession,
        activeVideoMeeting,

        // Data
        metrics,
        displaySessions,
        isLoading,
        error,
        hasNextPage,
        isFetchingNextPage,

        // Mutators/Handlers
        handleRangeChange,
        handleCreate,
        handleEdit,
        handleCloseDrawer,
        handleSave,
        handleDelete: async (sessionId: string, deleteForward: boolean) => {
            await deleteSession.mutateAsync({ sessionId, deleteForward });
            setDrawerOpen(false);
        },
        handleUpdateStatus: async (sessionId: string, status: string) => {
            await updateSessionStatus.mutateAsync({
                sessionId,
                payload: { status: status as any },
            });
        },
        handleSaveAttendance: async (sessionId: string, attendances: any[]) => {
            await updateAttendance.mutateAsync({ sessionId, attendances });
        },
        openSessionVideo,
        closeSessionVideo,
        joinMeetingPending: issueSessionMeetingToken.isPending,
        fetchNextPage,
        handleReset,
    };
};
