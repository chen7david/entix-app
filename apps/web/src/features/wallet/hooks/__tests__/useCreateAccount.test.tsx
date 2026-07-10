import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type CreateAccountInput, useCreateAccount } from "../useCreateAccount";

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

describe("useCreateAccount", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects when organization id is missing", async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useCreateAccount(undefined), { wrapper });

        const input: CreateAccountInput = {
            name: "Main Wallet",
            currencyId: "cur_1",
            ownerType: "org",
            ownerId: "org_1",
        };

        await expect(result.current.mutateAsync(input)).rejects.toThrow("Organization ID required");
        expect(mockNotificationError).toHaveBeenCalled();
    });

    it("posts account creation and shows success notification", async () => {
        const postAccount = vi.fn().mockResolvedValue({ ok: true });
        mockGetApiClient.mockReturnValue({
            api: {
                v1: {
                    orgs: {
                        ":organizationId": {
                            finance: {
                                accounts: {
                                    $post: postAccount,
                                },
                            },
                        },
                    },
                },
            },
        });
        mockHcJson.mockResolvedValue({ id: "acc_1" });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useCreateAccount("org_1"), { wrapper });

        const input: CreateAccountInput = {
            name: "Main Wallet",
            currencyId: "cur_1",
            ownerType: "org",
            ownerId: "org_1",
        };

        await result.current.mutateAsync(input);

        expect(postAccount).toHaveBeenCalledWith({
            param: { organizationId: "org_1" },
            json: input,
        });
        await waitFor(() => expect(mockNotificationSuccess).toHaveBeenCalled());
    });
});
