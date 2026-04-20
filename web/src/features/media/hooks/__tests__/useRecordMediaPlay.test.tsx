import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRecordMediaPlay } from "../useRecordMediaPlay";

const mockGetApiClient = vi.hoisted(() => vi.fn());
const mockUseOrganization = vi.hoisted(() => vi.fn());

vi.mock("@web/src/lib/api-client", () => ({
    getApiClient: mockGetApiClient,
}));

vi.mock("@web/src/features/organization", () => ({
    useOrganization: mockUseOrganization,
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    return function Wrapper({ children }: PropsWithChildren) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

describe("useRecordMediaPlay", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does nothing when mediaId or orgId is missing", () => {
        const postPlay = vi.fn();
        mockGetApiClient.mockReturnValue({
            api: {
                v1: {
                    orgs: {
                        ":organizationId": { media: { ":mediaId": { play: { $post: postPlay } } } },
                    },
                },
            },
        });
        mockUseOrganization.mockReturnValue({ activeOrganization: null });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useRecordMediaPlay(undefined), { wrapper });

        act(() => {
            result.current();
        });

        expect(postPlay).not.toHaveBeenCalled();
    });

    it("posts once per mediaId and posts again after mediaId changes", async () => {
        const postPlay = vi.fn().mockResolvedValue({ ok: true });
        mockGetApiClient.mockReturnValue({
            api: {
                v1: {
                    orgs: {
                        ":organizationId": { media: { ":mediaId": { play: { $post: postPlay } } } },
                    },
                },
            },
        });
        mockUseOrganization.mockReturnValue({ activeOrganization: { id: "org_1" } });

        const wrapper = createWrapper();
        const { result, rerender } = renderHook(({ mediaId }) => useRecordMediaPlay(mediaId), {
            initialProps: { mediaId: "media_1" as string | null | undefined },
            wrapper,
        });

        act(() => {
            result.current();
            result.current();
        });

        await waitFor(() => expect(postPlay).toHaveBeenCalledTimes(1));
        expect(postPlay).toHaveBeenNthCalledWith(1, {
            param: { organizationId: "org_1", mediaId: "media_1" },
        });

        rerender({ mediaId: "media_2" });
        act(() => {
            result.current();
        });

        await waitFor(() => expect(postPlay).toHaveBeenCalledTimes(2));
        expect(postPlay).toHaveBeenNthCalledWith(2, {
            param: { organizationId: "org_1", mediaId: "media_2" },
        });
    });
});
