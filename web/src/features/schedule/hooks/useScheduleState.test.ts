import { useDebouncedValue } from "@tanstack/react-pacer";
import { act, renderHook } from "@testing-library/react";
import { useSearchParams } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSchedule, useScheduleMetrics } from "./useSchedule";
import { useScheduleState } from "./useScheduleState";

// Mock dependencies
vi.mock("react-router", () => ({
    useSearchParams: vi.fn(),
}));

vi.mock("@tanstack/react-pacer", () => ({
    useDebouncedValue: vi.fn(),
}));

vi.mock("./useSchedule", () => ({
    useSchedule: vi.fn(),
    useScheduleMetrics: vi.fn(),
}));

describe("useScheduleState", () => {
    const mockSetSearchParams = vi.fn();
    const mockOrganizationId = "org_123";

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock for useSearchParams
        (useSearchParams as any).mockReturnValue([new URLSearchParams(), mockSetSearchParams]);

        // Default mock for useDebouncedValue
        (useDebouncedValue as any).mockImplementation((value: string) => [
            value,
            { state: { isPending: false } },
        ]);

        // Default mock for useSchedule
        (useSchedule as any).mockReturnValue({
            sessions: [],
            isLoading: false,
            error: null,
            createSession: { mutateAsync: vi.fn() },
            updateSession: { mutateAsync: vi.fn() },
            updateSessionStatus: { mutateAsync: vi.fn() },
            deleteSession: { mutateAsync: vi.fn() },
            updateAttendance: { mutateAsync: vi.fn() },
            issueSessionMeetingToken: { isPending: false, mutateAsync: vi.fn() },
            fetchNextPage: vi.fn(),
            hasNextPage: false,
            isFetchingNextPage: false,
        });

        // Default mock for useScheduleMetrics
        (useScheduleMetrics as any).mockReturnValue({
            metrics: { total: 0, completed: 0, cancelled: 0 },
            isLoading: false,
            error: null,
        });
    });

    it("initializes with default search and timeline", () => {
        const { result } = renderHook(() => useScheduleState(mockOrganizationId));

        expect(result.current.localSearch).toBe("");
        expect(result.current.timeline).toBe("Upcoming");
        expect(result.current.drawerOpen).toBe(false);
    });

    it("updates local search and triggers debounced effect", () => {
        const { result } = renderHook(() => useScheduleState(mockOrganizationId));

        act(() => {
            result.current.setLocalSearch("test query");
        });

        expect(result.current.localSearch).toBe("test query");
    });

    it("toggles drawer state correctly", () => {
        const { result } = renderHook(() => useScheduleState(mockOrganizationId));

        act(() => {
            result.current.handleCreate();
        });

        expect(result.current.drawerOpen).toBe(true);
        expect(result.current.selectedSession).toBeNull();

        act(() => {
            result.current.handleCloseDrawer();
        });

        expect(result.current.drawerOpen).toBe(false);
    });

    it("filters sessions correctly based on timeline", () => {
        const mockSessions = [
            { id: "1", startTime: Date.now() + 10000 }, // Future
            { id: "2", startTime: Date.now() - 10000 }, // Past
        ];
        (useSchedule as any).mockReturnValue({
            sessions: mockSessions,
            isLoading: false,
            error: null,
            createSession: { mutateAsync: vi.fn() },
            updateSession: { mutateAsync: vi.fn() },
            updateSessionStatus: { mutateAsync: vi.fn() },
            deleteSession: { mutateAsync: vi.fn() },
            updateAttendance: { mutateAsync: vi.fn() },
            issueSessionMeetingToken: { isPending: false, mutateAsync: vi.fn() },
            fetchNextPage: vi.fn(),
            hasNextPage: false,
            isFetchingNextPage: false,
        });

        const { result } = renderHook(() => useScheduleState(mockOrganizationId));

        // Default is "Upcoming" — only the future session shows
        expect(result.current.displaySessions).toHaveLength(1);
        expect(result.current.displaySessions[0].id).toBe("1");

        // Switch to All — both sessions show
        act(() => {
            result.current.setTimeline("All");
        });
        expect(result.current.displaySessions).toHaveLength(2);

        // Upcoming
        act(() => {
            result.current.setTimeline("Upcoming");
        });
        expect(result.current.displaySessions).toHaveLength(1);
        expect(result.current.displaySessions[0].id).toBe("1");

        // Past
        act(() => {
            result.current.setTimeline("Past");
        });
        expect(result.current.displaySessions).toHaveLength(1);
        expect(result.current.displaySessions[0].id).toBe("2");
    });
});
