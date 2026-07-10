import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStudentWallets } from "../useSessionStudentWallets";

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

describe("useSessionStudentWallets", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("is idle when organizationId is missing", () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useSessionStudentWallets(undefined, ["u1"]), {
            wrapper,
        });
        expect(result.current[0]?.fetchStatus).toBe("idle");
        expect(mockGetApiClient).not.toHaveBeenCalled();
    });

    it("fetches wallet summary per student", async () => {
        const getSummary = vi.fn().mockResolvedValue({ ok: true });
        mockGetApiClient.mockReturnValue({
            api: {
                v1: {
                    orgs: {
                        ":organizationId": {
                            members: {
                                ":userId": {
                                    wallet: {
                                        summary: {
                                            $get: getSummary,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        mockHcJson.mockResolvedValue({ data: { accounts: [] } });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useSessionStudentWallets("org_1", ["user_a"]), {
            wrapper,
        });

        await waitFor(() => expect(result.current[0]?.isSuccess).toBe(true));
        expect(getSummary).toHaveBeenCalledWith({
            param: { organizationId: "org_1", userId: "user_a" },
        });
    });
});
