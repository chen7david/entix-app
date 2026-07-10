import { AppRoutes } from "@shared";
import { render, screen } from "@testing-library/react";
import { useAuth } from "@web/src/features/auth";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { GuestRoute } from "./GuestRoute";

vi.mock("@web/src/features/auth", () => ({
    useAuth: vi.fn(),
}));

const GuestPage = () => <div data-testid="guest-page">Guest</div>;
const HomePage = () => <div data-testid="home-page">Home</div>;
const DashboardPage = () => <div data-testid="dashboard-page">Dashboard</div>;

describe("GuestRoute", () => {
    it("shows loader while auth is loading", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            isSuperAdmin: false,
            refreshAuth: vi.fn() as any,
        });

        const { container } = render(
            <MemoryRouter>
                <GuestRoute />
            </MemoryRouter>
        );

        expect(container.querySelector(".ant-spin")).toBeInTheDocument();
    });

    it("renders outlet when unauthenticated", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isSuperAdmin: false,
            refreshAuth: vi.fn() as any,
        });

        render(
            <MemoryRouter initialEntries={[AppRoutes.auth.signIn]}>
                <Routes>
                    <Route element={<GuestRoute />}>
                        <Route path={AppRoutes.auth.signIn} element={<GuestPage />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId("guest-page")).toBeInTheDocument();
    });

    it("redirects authenticated users to default path", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: {
                id: "1",
                email: "a@b.com",
                name: "A",
                globalRole: "user",
                emailVerified: true,
                orgRole: null,
                activeMemberId: null,
                activeOrganizationId: null,
            },
            isAuthenticated: true,
            isLoading: false,
            isSuperAdmin: false,
            refreshAuth: vi.fn() as any,
        });

        render(
            <MemoryRouter initialEntries={[AppRoutes.auth.signIn]}>
                <Routes>
                    <Route element={<GuestRoute />}>
                        <Route path={AppRoutes.auth.signIn} element={<GuestPage />} />
                    </Route>
                    <Route path="/" element={<HomePage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId("home-page")).toBeInTheDocument();
        expect(screen.queryByTestId("guest-page")).not.toBeInTheDocument();
    });

    it("redirects authenticated users back to the protected from location", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: {
                id: "1",
                email: "a@b.com",
                name: "A",
                globalRole: "user",
                emailVerified: true,
                orgRole: null,
                activeMemberId: null,
                activeOrganizationId: null,
            },
            isAuthenticated: true,
            isLoading: false,
            isSuperAdmin: false,
            refreshAuth: vi.fn() as any,
        });

        render(
            <MemoryRouter
                initialEntries={[
                    {
                        pathname: AppRoutes.auth.signIn,
                        state: { from: { pathname: "/dashboard" } },
                    },
                ]}
            >
                <Routes>
                    <Route element={<GuestRoute />}>
                        <Route path={AppRoutes.auth.signIn} element={<GuestPage />} />
                    </Route>
                    <Route path="/dashboard" element={<DashboardPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    });
});
