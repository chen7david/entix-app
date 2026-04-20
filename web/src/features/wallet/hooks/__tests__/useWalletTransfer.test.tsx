import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type TransferInput, useWalletTransfer } from "../useWalletTransfer";

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
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    return function Wrapper({ children }: PropsWithChildren) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

describe("useWalletTransfer", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects when organization id is missing", async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useWalletTransfer(undefined), { wrapper });

        const input: TransferInput = {
            categoryId: "fcat_internal_transfer",
            sourceAccountId: "acc_from",
            destinationAccountId: "acc_to",
            currencyId: "cur_1",
            amountCents: 500,
            description: "Top-up",
        };

        await expect(result.current.mutateAsync(input)).rejects.toThrow("Organization ID required");
    });

    it("posts transfer payload to finance transfer endpoint", async () => {
        const postTransfer = vi.fn().mockResolvedValue({ ok: true });
        mockGetApiClient.mockReturnValue({
            api: {
                v1: {
                    orgs: {
                        ":organizationId": {
                            finance: {
                                transfer: {
                                    $post: postTransfer,
                                },
                            },
                        },
                    },
                },
            },
        });
        mockHcJson.mockResolvedValue({ id: "tx_1" });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useWalletTransfer("org_1"), { wrapper });

        const input: TransferInput = {
            categoryId: "fcat_internal_transfer",
            sourceAccountId: "acc_from",
            destinationAccountId: "acc_to",
            currencyId: "cur_1",
            amountCents: 500,
            description: "Top-up",
        };

        await result.current.mutateAsync(input);

        expect(postTransfer).toHaveBeenCalledWith({
            param: { organizationId: "org_1" },
            json: input,
        });
    });
});
