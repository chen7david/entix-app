import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useActivatedCurrencies, useOrgCurrencies } from "../useOrgCurrencies";

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

describe("useOrgCurrencies", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("is disabled without organization id", () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useOrgCurrencies(undefined), { wrapper });

        expect(result.current.fetchStatus).toBe("idle");
        expect(mockGetApiClient).not.toHaveBeenCalled();
    });

    it("filters activated currencies in useActivatedCurrencies", async () => {
        const getMock = vi.fn().mockResolvedValue({ ok: true });
        mockGetApiClient.mockReturnValue({
            api: {
                v1: {
                    orgs: {
                        ":organizationId": {
                            finance: {
                                currencies: {
                                    $get: getMock,
                                },
                            },
                        },
                    },
                },
            },
        });

        mockHcJson.mockResolvedValue({
            data: [
                {
                    id: "cur1",
                    code: "USD",
                    name: "US Dollar",
                    symbol: "$",
                    isActivated: true,
                    accountId: "acc1",
                    balanceCents: 100,
                },
                {
                    id: "cur2",
                    code: "EUR",
                    name: "Euro",
                    symbol: "€",
                    isActivated: false,
                    accountId: null,
                    balanceCents: null,
                },
            ],
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useActivatedCurrencies("org_123"), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(getMock).toHaveBeenCalledWith({
            param: { organizationId: "org_123" },
        });
        expect(result.current.currencies).toHaveLength(1);
        expect(result.current.currencies[0]?.id).toBe("cur1");
    });
});
