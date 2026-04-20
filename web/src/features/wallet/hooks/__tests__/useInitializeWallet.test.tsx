import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInitializeWallet } from "../useInitializeWallet";

const mockGetApiClient = vi.hoisted(() => vi.fn());
const mockHcJson = vi.hoisted(() => vi.fn());
const mockNotificationSuccess = vi.hoisted(() => vi.fn());
const mockNotificationError = vi.hoisted(() => vi.fn());

vi.mock("@web/src/lib/api-client", () => ({
    getApiClient: mockGetApiClient,
}));

vi.mock("@web/src/lib/hc-json", () => ({
    hcJson: mockHcJson,
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

describe("useInitializeWallet", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("posts initialize-wallet request and shows success notification", async () => {
        const postInitialize = vi.fn().mockResolvedValue({ ok: true });
        mockGetApiClient.mockReturnValue({
            api: {
                v1: {
                    orgs: {
                        ":organizationId": {
                            members: {
                                ":userId": {
                                    wallet: {
                                        initialize: {
                                            $post: postInitialize,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        mockHcJson.mockResolvedValue({ message: "Wallet ready" });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useInitializeWallet("org_1"), { wrapper });

        await result.current.mutateAsync("user_1");

        expect(postInitialize).toHaveBeenCalledWith({
            param: { organizationId: "org_1", userId: "user_1" },
        });
        await waitFor(() => expect(mockNotificationSuccess).toHaveBeenCalled());
    });

    it("shows error notification when mutation fails", async () => {
        const postInitialize = vi.fn().mockResolvedValue({ ok: false });
        mockGetApiClient.mockReturnValue({
            api: {
                v1: {
                    orgs: {
                        ":organizationId": {
                            members: {
                                ":userId": {
                                    wallet: {
                                        initialize: {
                                            $post: postInitialize,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        mockHcJson.mockRejectedValue(new Error("Cannot initialize"));

        const wrapper = createWrapper();
        const { result } = renderHook(() => useInitializeWallet("org_1"), { wrapper });

        await expect(result.current.mutateAsync("user_1")).rejects.toThrow("Cannot initialize");
        expect(mockNotificationError).toHaveBeenCalled();
    });
});
