import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTransactions } from "../useTransactions";

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

describe("useTransactions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("is disabled when org id is missing", () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useTransactions(undefined), { wrapper });

        expect(result.current.fetchStatus).toBe("idle");
        expect(mockGetApiClient).not.toHaveBeenCalled();
    });

    it("fetches transactions and maps to paginated response", async () => {
        const getTransactions = vi.fn().mockResolvedValue({ ok: true });
        mockGetApiClient.mockReturnValue({
            api: {
                v1: {
                    orgs: {
                        ":organizationId": {
                            finance: {
                                transactions: {
                                    $get: getTransactions,
                                },
                            },
                        },
                    },
                },
            },
        });

        mockHcJson.mockResolvedValue({
            data: [{ id: "tx_1" }],
            nextCursor: "next_1",
        });

        const wrapper = createWrapper();
        const { result } = renderHook(
            () => useTransactions("org_1", { status: "completed", limit: 20 }),
            { wrapper }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(getTransactions).toHaveBeenCalledWith({
            param: { organizationId: "org_1" },
            query: {
                cursor: undefined,
                limit: 20,
                startDate: undefined,
                endDate: undefined,
                minAmount: undefined,
                maxAmount: undefined,
                txId: undefined,
                accountId: undefined,
                status: "completed",
            },
        });
        expect(result.current.data).toEqual({
            items: [{ id: "tx_1" }],
            nextCursor: "next_1",
            prevCursor: null,
        });
    });
});
