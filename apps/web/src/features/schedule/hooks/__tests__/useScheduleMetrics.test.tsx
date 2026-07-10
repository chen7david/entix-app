import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useScheduleMetrics } from "../useSchedule";

const mockGetApiClient = vi.hoisted(() => vi.fn());
const mockHcJson = vi.hoisted(() => vi.fn());

vi.mock("@web/src/lib/api-client", () => ({
    getApiClient: mockGetApiClient,
}));

vi.mock("@web/src/lib/hc-json", () => ({
    hcJson: mockHcJson,
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return function Wrapper({ children }: PropsWithChildren) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

describe("useScheduleMetrics", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns default metrics when organization id is missing", async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useScheduleMetrics(undefined), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.metrics).toBeUndefined();
        expect(mockGetApiClient).not.toHaveBeenCalled();
    });

    it("fetches metrics when organization id is provided", async () => {
        const getMetrics = vi.fn().mockResolvedValue({ ok: true });
        mockGetApiClient.mockReturnValue({
            api: {
                v1: {
                    orgs: {
                        ":organizationId": {
                            schedule: {
                                metrics: {
                                    $get: getMetrics,
                                },
                            },
                        },
                    },
                },
            },
        });

        mockHcJson.mockResolvedValue({ total: 10, completed: 7, cancelled: 1 });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useScheduleMetrics("org_1", 100, 200), { wrapper });

        await waitFor(() =>
            expect(result.current.metrics).toEqual({ total: 10, completed: 7, cancelled: 1 })
        );
        expect(getMetrics).toHaveBeenCalledWith({
            param: { organizationId: "org_1" },
            query: { startDate: 100, endDate: 200 },
        });
    });
});
