import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSchedule } from "../useSchedule";

const mockGetApiClient = vi.hoisted(() => vi.fn());
const mockHcJson = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());
const mockNotificationSuccess = vi.hoisted(() => vi.fn());
const mockNotificationError = vi.hoisted(() => vi.fn());

vi.mock("@web/src/lib/api-client", () => ({
    getApiClient: mockGetApiClient,
}));

vi.mock("@web/src/lib/hc-json", () => ({
    hcJson: mockHcJson,
}));

vi.mock("@web/src/features/auth", () => ({
    useAuth: mockUseAuth,
}));

vi.mock("antd", () => ({
    App: {
        useApp: () => ({
            notification: {
                success: mockNotificationSuccess,
                error: mockNotificationError,
            },
        }),
    },
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    return function Wrapper({ children }: PropsWithChildren) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

describe("useSchedule", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({ isAuthenticated: true });
    });

    it("returns empty sessions when organization id is missing", async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useSchedule(undefined), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.sessions).toEqual([]);
        expect(mockGetApiClient).not.toHaveBeenCalled();
    });

    it("fetches schedule pages and allows creating a session", async () => {
        const getSchedule = vi.fn().mockResolvedValue({ ok: true, tag: "get" });
        const postSchedule = vi.fn().mockResolvedValue({ ok: true, tag: "post" });

        mockGetApiClient.mockReturnValue({
            api: {
                v1: {
                    orgs: {
                        ":organizationId": {
                            schedule: Object.assign(
                                {
                                    $get: getSchedule,
                                    $post: postSchedule,
                                },
                                {
                                    ":sessionId": {
                                        $patch: vi.fn(),
                                        $delete: vi.fn(),
                                        status: { $patch: vi.fn() },
                                        attendances: { $patch: vi.fn() },
                                    },
                                }
                            ),
                        },
                    },
                },
            },
        });

        mockHcJson.mockImplementation(async (res: { tag?: string }) => {
            if (res.tag === "get") {
                return {
                    items: [{ id: "sess_1", title: "Session" }],
                    nextCursor: null,
                    prevCursor: null,
                };
            }
            return { id: "sess_2" };
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSchedule("org_1"), { wrapper });

        await waitFor(() => expect(result.current.sessions.length).toBe(1));
        expect(getSchedule).toHaveBeenCalled();

        await result.current.createSession.mutateAsync({
            lessonId: "lesson_1",
            teacherId: "teacher_1",
            title: "New Session",
            description: "desc",
            startTime: 123,
            durationMinutes: 45,
            userIds: ["u1"],
        });

        expect(postSchedule).toHaveBeenCalledWith({
            param: { organizationId: "org_1" },
            json: {
                lessonId: "lesson_1",
                teacherId: "teacher_1",
                title: "New Session",
                description: "desc",
                startTime: 123,
                durationMinutes: 45,
                userIds: ["u1"],
            },
        });
        expect(mockNotificationSuccess).toHaveBeenCalled();
    });
});
