import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMedia } from "../useMedia";

const mockUseOrganization = vi.hoisted(() => vi.fn());

vi.mock("@web/src/features/organization", () => ({
    useOrganization: mockUseOrganization,
}));

vi.mock("@web/src/lib/api-client", () => ({
    getApiClient: vi.fn(),
}));

vi.mock("antd", () => ({
    App: {
        useApp: () => ({
            notification: { success: vi.fn(), error: vi.fn() },
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

describe("useMedia", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseOrganization.mockReturnValue({ activeOrganization: null });
    });

    it("returns empty media list when active organization is missing", async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useMedia("video", "test"), { wrapper });

        await waitFor(() => expect(result.current.isLoadingMedia).toBe(false));
        expect(result.current.media).toEqual([]);
        expect(result.current.hasNextPage).toBe(false);
    });

    it("returns paged cursors as null in paged mode without organization", async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(
            () => useMedia("video", "", { cursor: undefined, limit: 10, direction: "next" }),
            { wrapper }
        );

        await waitFor(() => expect(result.current.isLoadingMedia).toBe(false));
        expect(result.current.nextCursor).toBeNull();
        expect(result.current.prevCursor).toBeNull();
        expect(result.current.media).toEqual([]);
    });
});
