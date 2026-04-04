import { AppRoutes } from "@shared";
import { render, screen } from "@testing-library/react";
import { useAuth } from "@web/src/features/auth";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";

// Mock useAuth
vi.mock("@web/src/features/auth", () => ({
    useAuth: vi.fn(),
}));

const MockDashboard = () => <div data-testid="dashboard-page">Dashboard</div>;
const MockSignIn = () => <div data-testid="signin-page">Sign In</div>;
const MockUnauthorized = () => <div data-testid="unauthorized-page">Unauthorized</div>;

describe("ProtectedRoute", () => {
    it("should show loader when authentication is loading", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            isSuperAdmin: false,
            refreshAuth: vi.fn() as any,
        });

        const { container } = render(
            <MemoryRouter>
                <ProtectedRoute />
            </MemoryRouter>
        );

        expect(container.querySelector(".ant-spin")).toBeInTheDocument();
    });

    it("should redirect to sign-in when not authenticated", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isSuperAdmin: false,
            refreshAuth: vi.fn() as any,
        });

        render(
            <MemoryRouter initialEntries={["/dashboard"]}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<MockDashboard />} />
                    </Route>
                    <Route path={AppRoutes.auth.signIn} element={<MockSignIn />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId("signin-page")).toBeInTheDocument();
    });

    it("should allow access when authenticated", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: {
                id: "1",
                email: "test@example.com",
                name: "Test User",
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
            <MemoryRouter initialEntries={["/dashboard"]}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<MockDashboard />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    });

    it("should deny access for incorrect global role", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: {
                id: "1",
                email: "test@example.com",
                name: "Test User",
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
            <MemoryRouter initialEntries={["/admin"]}>
                <Routes>
                    <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                        <Route path="/admin" element={<MockDashboard />} />
                    </Route>
                    <Route path={AppRoutes.unauthorized} element={<MockUnauthorized />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId("unauthorized-page")).toBeInTheDocument();
    });

    it("should deny access for incorrect organization role", () => {
        vi.mocked(useAuth).mockReturnValue({
            user: {
                id: "1",
                email: "test@example.com",
                name: "Test User",
                globalRole: "user",
                emailVerified: true,
                orgRole: "member",
                activeMemberId: "m1",
                activeOrganizationId: "o1",
            },
            isAuthenticated: true,
            isLoading: false,
            isSuperAdmin: false,
            refreshAuth: vi.fn() as any,
        });

        render(
            <MemoryRouter initialEntries={["/manage"]}>
                <Routes>
                    <Route element={<ProtectedRoute allowedOrgRoles={["admin", "owner"]} />}>
                        <Route path="/manage" element={<MockDashboard />} />
                    </Route>
                    <Route path={AppRoutes.unauthorized} element={<MockUnauthorized />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId("unauthorized-page")).toBeInTheDocument();
    });
});
