import { AppRoutes } from "@shared";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { useAuth } from "./features/auth/context/AuthContext";
import { useOrganization } from "./features/organization/hooks/useOrganization";

// Mock hooks
vi.mock("./features/auth/context/AuthContext", () => ({
    useAuth: vi.fn(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("./features/organization/hooks/useOrganization", () => ({
    useOrganization: vi.fn(),
}));

// Mock CenteredSpin
vi.mock("./components/common/CenteredView", () => ({
    CenteredSpin: () => <div data-testid="loading-spinner">Loading...</div>,
    CenteredView: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("HomeRedirect UX Logic", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should redirect anonymous users to the sign-in page", async () => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isSuperAdmin: false,
            refreshAuth: vi.fn() as any,
        });

        vi.mocked(useOrganization).mockReturnValue({
            organizations: [],
            activeOrganization: null,
            loading: false,
            isFetching: false,
            isSwitching: false,
            listOrganizations: vi.fn(),
            setActive: vi.fn(),
            checkOrganizationStatus: vi.fn().mockResolvedValue({ orgs: [], activeOrg: null }),
        });

        render(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<App />} />
                    <Route
                        path={AppRoutes.auth.signIn}
                        element={<div data-testid="signin-page">Sign In</div>}
                    />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId("signin-page")).toBeInTheDocument();
        });
    });

    it("should show a loading spinner while identifying organization status", async () => {
        vi.mocked(useAuth).mockReturnValue({
            user: { id: "1" } as any,
            isAuthenticated: true,
            isLoading: false,
            isSuperAdmin: false,
            refreshAuth: vi.fn() as any,
        });

        vi.mocked(useOrganization).mockReturnValue({
            organizations: [],
            activeOrganization: null,
            loading: true,
            isFetching: true,
            isSwitching: false,
            listOrganizations: vi.fn(),
            setActive: vi.fn(),
            checkOrganizationStatus: vi.fn().mockResolvedValue({ orgs: [], activeOrg: null }),
        });

        render(
            <MemoryRouter initialEntries={["/"]}>
                <App />
            </MemoryRouter>
        );

        expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    it("should call checkOrganizationStatus for authenticated users", async () => {
        const mockCheckStatus = vi.fn();

        vi.mocked(useAuth).mockReturnValue({
            user: { id: "1" } as any,
            isAuthenticated: true,
            isLoading: false,
            isSuperAdmin: false,
            refreshAuth: vi.fn() as any,
        });

        vi.mocked(useOrganization).mockReturnValue({
            organizations: [],
            activeOrganization: null,
            loading: false,
            isFetching: false,
            isSwitching: false,
            listOrganizations: vi.fn(),
            setActive: vi.fn(),
            checkOrganizationStatus: mockCheckStatus.mockResolvedValue({
                orgs: [],
                activeOrg: null,
            }),
        });

        render(
            <MemoryRouter initialEntries={["/"]}>
                <App />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockCheckStatus).toHaveBeenCalled();
        });
    });
});
