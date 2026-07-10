import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTransactionHistory } from "../useTransactionHistory";

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

describe("useTransactionHistory", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("is disabled when required identifiers are missing", () => {
        const wrapper = createWrapper();

        const orgQuery = renderHook(() => useTransactionHistory(undefined, "org"), { wrapper });
        const userQuery = renderHook(() => useTransactionHistory("user_1", "user", undefined, 20), {
            wrapper,
        });

        expect(orgQuery.result.current.fetchStatus).toBe("idle");
        expect(userQuery.result.current.fetchStatus).toBe("idle");
        expect(mockGetApiClient).not.toHaveBeenCalled();
    });

    it("fetches org transaction history with filters", async () => {
        const getTxs = vi.fn().mockResolvedValue({ ok: true });
        mockGetApiClient.mockReturnValue({
            api: {
                v1: {
                    orgs: {
                        ":organizationId": {
                            finance: {
                                transactions: {
                                    $get: getTxs,
                                },
                            },
                        },
                    },
                },
            },
        });

        mockHcJson.mockResolvedValue({
            data: [],
            nextCursor: null,
        });

        const wrapper = createWrapper();
        const { result } = renderHook(
            () =>
                useTransactionHistory("org_123", "org", "cursor_1", 50, undefined, {
                    status: "completed",
                    accountId: "acc_1",
                }),
            { wrapper }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(getTxs).toHaveBeenCalledWith({
            param: { organizationId: "org_123" },
            query: {
                limit: 50,
                cursor: "cursor_1",
                startDate: undefined,
                endDate: undefined,
                status: "completed",
                txId: undefined,
                accountId: "acc_1",
            },
        });
        expect(result.current.data).toEqual({ data: [], nextCursor: null });
    });
});
