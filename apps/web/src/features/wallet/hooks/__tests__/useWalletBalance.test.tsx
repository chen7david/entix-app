import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWalletBalance } from "../useWalletBalance";

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

describe("useWalletBalance", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("is disabled when required identifiers are missing", () => {
        const wrapper = createWrapper();

        const orgQuery = renderHook(() => useWalletBalance(undefined, "org"), { wrapper });
        const userQuery = renderHook(() => useWalletBalance("user_1", "user", undefined), {
            wrapper,
        });

        expect(orgQuery.result.current.fetchStatus).toBe("idle");
        expect(userQuery.result.current.fetchStatus).toBe("idle");
        expect(mockGetApiClient).not.toHaveBeenCalled();
    });

    it("fetches org wallet summary and selects data", async () => {
        const getSummary = vi.fn().mockResolvedValue({ ok: true });
        mockGetApiClient.mockReturnValue({
            api: {
                v1: {
                    orgs: {
                        ":organizationId": {
                            finance: {
                                summary: {
                                    $get: getSummary,
                                },
                            },
                        },
                    },
                },
            },
        });

        mockHcJson.mockResolvedValue({
            data: {
                totalCredits: 1000,
                totalDebits: 200,
            },
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useWalletBalance("org_123", "org"), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(getSummary).toHaveBeenCalledWith({
            param: { organizationId: "org_123" },
        });
        expect(result.current.data).toEqual({
            totalCredits: 1000,
            totalDebits: 200,
        });
    });
});
