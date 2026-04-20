import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTreasuryBalance } from "../useTreasuryBalance";

const mockGetApiClient = vi.hoisted(() => vi.fn());
const mockParseApiError = vi.hoisted(() => vi.fn());

vi.mock("@web/src/lib/api-client", () => ({
    getApiClient: mockGetApiClient,
}));

vi.mock("@web/src/utils/api", () => ({
    parseApiError: mockParseApiError,
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return function Wrapper({ children }: PropsWithChildren) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

describe("useTreasuryBalance", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns empty list on 404", async () => {
        const getBalance = vi.fn().mockResolvedValue({ status: 404, ok: false });
        mockGetApiClient.mockReturnValue({
            api: { v1: { admin: { finance: { treasury: { balance: { $get: getBalance } } } } } },
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useTreasuryBalance(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([]);
        expect(mockParseApiError).not.toHaveBeenCalled();
    });

    it("returns treasury balances from API payload", async () => {
        const getBalance = vi.fn().mockResolvedValue({
            status: 200,
            ok: true,
            json: async () => ({ data: [{ id: "acc_1", name: "Treasury" }] }),
        });
        mockGetApiClient.mockReturnValue({
            api: { v1: { admin: { finance: { treasury: { balance: { $get: getBalance } } } } } },
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useTreasuryBalance(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([{ id: "acc_1", name: "Treasury" }]);
    });
});
