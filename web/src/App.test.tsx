import { AppRoutes } from "@shared";
import { render, screen } from "@testing-library/react";
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

// No longer using checkOrganizationStatus

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
            isOwner: false,
            isAdmin: false,
            isTeacher: false,
            isStudent: false,
            isAdminOrOwner: false,
            isStaff: false,
            refreshAuth: vi.fn() as any,
        });

        vi.mocked(useOrganization).mockReturnValue({
            organizations: [],
            activeOrganization: null,
            orgsLoaded: true,
            isSwitching: false,
            setActive: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="*" element={<App />} />
                    <Route
                        path={AppRoutes.auth.signIn}
                        element={<div data-testid="signin-page">Sign In</div>}
                    />
                </Routes>
            </MemoryRouter>
        );

        // Await the redirect result
        const signinPage = await screen.findByTestId("signin-page");
        expect(signinPage).toBeInTheDocument();
    });

    it("should show a loading spinner while identifying organization status", async () => {
        vi.mocked(useAuth).mockReturnValue({
            user: { id: "1" } as any,
            isAuthenticated: true,
            isLoading: false,
            isSuperAdmin: false,
            isOwner: false,
            isAdmin: false,
            isTeacher: false,
            isStudent: false,
            isAdminOrOwner: false,
            isStaff: false,
            refreshAuth: vi.fn() as any,
        });

        vi.mocked(useOrganization).mockReturnValue({
            organizations: [],
            activeOrganization: null,
            orgsLoaded: false,
            isSwitching: false,
            setActive: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={["/"]}>
                <App />
            </MemoryRouter>
        );

        const spinner = await screen.findByTestId("loading-spinner");
        expect(spinner).toBeInTheDocument();
    });

    it("should redirect to onboarding if user has no organizations", async () => {
        vi.mocked(useAuth).mockReturnValue({
            user: { id: "1" } as any,
            isAuthenticated: true,
            isLoading: false,
            isSuperAdmin: false,
            isOwner: false,
            isAdmin: false,
            isTeacher: false,
            isStudent: false,
            isAdminOrOwner: false,
            isStaff: false,
            refreshAuth: vi.fn() as any,
        });

        vi.mocked(useOrganization).mockReturnValue({
            organizations: [],
            activeOrganization: null,
            orgsLoaded: true,
            isSwitching: false,
            setActive: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="*" element={<App />} />
                    <Route
                        path={AppRoutes.onboarding.noOrganization}
                        element={<div data-testid="no-org-page">Onboarding</div>}
                    />
                </Routes>
            </MemoryRouter>
        );

        const onboardingPage = await screen.findByTestId("no-org-page");
        expect(onboardingPage).toBeInTheDocument();
    });
});
