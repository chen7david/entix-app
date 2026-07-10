import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useAuth } from "@web/src/features/auth";
import { useOrganization } from "@web/src/features/organization/hooks/useOrganization";
import { authClient } from "@web/src/lib/auth-client";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrgGuard } from "./OrgGuard";

vi.mock("@web/src/features/auth", () => ({
    useAuth: vi.fn(),
}));

vi.mock("@web/src/features/organization/hooks/useOrganization", () => ({
    useOrganization: vi.fn(),
}));

vi.mock("@web/src/lib/auth-client", () => ({
    authClient: {
        organization: {
            setActive: vi.fn(),
        },
    },
}));

const OrgChild = () => <div data-testid="org-child">Org content</div>;

function renderOrgGuard(slug: string) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[`/org/${slug}/dashboard`]}>
                <Routes>
                    <Route path="/org/:slug/*" element={<OrgGuard />}>
                        <Route path="dashboard" element={<OrgChild />} />
                    </Route>
                    <Route
                        path="/onboarding/select-organization"
                        element={<div data-testid="select-org">Select org</div>}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );
}

function mockOrgList() {
    vi.mocked(useOrganization).mockReturnValue({
        organizations: [{ id: "org_1", slug: "acme", name: "Acme" }],
        activeOrganization: null,
        orgsLoaded: true,
        orgsFetching: false,
        isSwitching: false,
        setActive: vi.fn(),
    } as any);
}

describe("OrgGuard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.mocked(useAuth).mockReturnValue({
            user: {
                id: "u1",
                email: "a@b.com",
                name: "A",
                globalRole: "user",
                emailVerified: true,
                orgRole: "owner",
                activeMemberId: "m1",
                activeOrganizationId: "org_1",
            },
            isAuthenticated: true,
            isLoading: false,
            isSuperAdmin: false,
            refreshAuth: vi.fn().mockResolvedValue(undefined) as any,
        });
    });

    it("shows spinner while organizations are loading", () => {
        vi.mocked(useOrganization).mockReturnValue({
            organizations: [],
            activeOrganization: null,
            orgsLoaded: false,
            orgsFetching: true,
            isSwitching: false,
            setActive: vi.fn(),
        } as any);

        const { container } = renderOrgGuard("acme");
        expect(container.querySelector(".ant-spin")).toBeInTheDocument();
        expect(screen.queryByTestId("org-child")).not.toBeInTheDocument();
    });

    it("denies access when slug is not in the user's org list", async () => {
        vi.mocked(useOrganization).mockReturnValue({
            organizations: [{ id: "org_1", slug: "acme", name: "Acme" }],
            activeOrganization: null,
            orgsLoaded: true,
            orgsFetching: false,
            isSwitching: false,
            setActive: vi.fn(),
        } as any);

        renderOrgGuard("other-org");

        await waitFor(() => {
            expect(screen.getByText("Access Denied")).toBeInTheDocument();
        });
        expect(screen.queryByTestId("org-child")).not.toBeInTheDocument();
        expect(authClient.organization.setActive).not.toHaveBeenCalled();
    });

    it("syncs active organization and renders children for a valid slug", async () => {
        vi.mocked(authClient.organization.setActive).mockResolvedValue({ data: {}, error: null });
        mockOrgList();

        renderOrgGuard("acme");

        await waitFor(() => {
            expect(authClient.organization.setActive).toHaveBeenCalledWith({
                organizationId: "org_1",
            });
        });
        await waitFor(() => {
            expect(screen.getByTestId("org-child")).toBeInTheDocument();
        });
    });

    it("blocks children when organization sync fails", async () => {
        vi.mocked(authClient.organization.setActive).mockRejectedValue(new Error("network"));
        mockOrgList();

        renderOrgGuard("acme");

        await waitFor(() => {
            expect(screen.getByText("Organization sync failed")).toBeInTheDocument();
        });
        expect(screen.queryByTestId("org-child")).not.toBeInTheDocument();
    });

    it("retries setActive when Retry is clicked after sync failure", async () => {
        vi.mocked(authClient.organization.setActive)
            .mockRejectedValueOnce(new Error("network"))
            .mockResolvedValueOnce({ data: {}, error: null });
        mockOrgList();

        renderOrgGuard("acme");

        await waitFor(() => {
            expect(screen.getByText("Organization sync failed")).toBeInTheDocument();
        });
        expect(authClient.organization.setActive).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Retry" }));

        await waitFor(() => {
            expect(authClient.organization.setActive).toHaveBeenCalledTimes(2);
        });
        await waitFor(() => {
            expect(screen.getByTestId("org-child")).toBeInTheDocument();
        });
    });
});
