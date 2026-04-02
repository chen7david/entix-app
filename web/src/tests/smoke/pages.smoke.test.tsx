import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../features/auth/context/AuthContext";
import { useOrgCurrencies } from "../../features/finance/hooks/useOrgCurrencies";
import { useOrganization } from "../../features/organization/hooks/useOrganization";
import { useWalletBalance } from "../../features/wallet/hooks/useWalletBalance";
import { FinanceAccountsPage } from "../../pages/dashboard/finance/FinanceAccountsPage";
import { renderWithProviders } from "../test-utils";

// Mock hooks
vi.mock("../../features/finance/hooks/useOrgCurrencies", () => ({
    useOrgCurrencies: vi.fn(),
}));

vi.mock("../../features/wallet/hooks/useWalletBalance", () => ({
    useWalletBalance: vi.fn(),
}));

vi.mock("../../features/organization/hooks/useOrganization", () => ({
    useOrganization: vi.fn(),
}));

vi.mock("../../features/auth/context/AuthContext", () => ({
    useAuth: vi.fn(),
}));

// Mock Ant Design Grid to prevent Layout issues in JSDOM
vi.mock("antd", async () => {
    const actual = await vi.importActual("antd");
    return {
        ...actual,
        Grid: {
            useBreakpoint: () => ({ md: true }),
        },
    };
});

describe("FinanceAccountsPage Smoke Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock for Organization and Auth
        vi.mocked(useOrganization).mockReturnValue({
            activeOrganization: { id: "org_1" } as any,
        } as any);

        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
        } as any);
    });

    it("renders without crash during loading (undefined data)", () => {
        vi.mocked(useOrgCurrencies).mockReturnValue({ data: undefined, isLoading: true } as any);
        vi.mocked(useWalletBalance).mockReturnValue({ data: undefined, isLoading: true } as any);

        // This is exactly what crashed - it should now render without throwing
        expect(() => renderWithProviders(<FinanceAccountsPage />)).not.toThrow();
    });

    it("renders without crash when data is empty array", () => {
        vi.mocked(useOrgCurrencies).mockReturnValue({ data: [], isLoading: false } as any);
        vi.mocked(useWalletBalance).mockReturnValue({
            data: { accounts: [] },
            isLoading: false,
        } as any);

        expect(() => renderWithProviders(<FinanceAccountsPage />)).not.toThrow();
    });

    it("renders without crash with populated data", () => {
        vi.mocked(useOrgCurrencies).mockReturnValue({
            data: [{ id: "curr_usd", isActivated: true, code: "USD", symbol: "$" }],
            isLoading: false,
        } as any);
        vi.mocked(useWalletBalance).mockReturnValue({
            data: {
                accounts: [
                    {
                        id: "acc_1",
                        name: "Main Treasury",
                        balanceCents: 1000,
                        currencyId: "curr_usd",
                        isFundingAccount: true,
                    },
                ],
            },
            isLoading: false,
        } as any);

        expect(() => renderWithProviders(<FinanceAccountsPage />)).not.toThrow();
    });
});
