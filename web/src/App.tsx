import { AppRoutes } from "@shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Navigate, Route, Routes } from "react-router";
import { CenteredSpin } from "./components/common/CenteredView";
import { ErrorFallback } from "./components/error/ErrorFallback";
import { GuestRoute } from "./components/guards/GuestRoute";
import { OrgGuard } from "./components/guards/OrgGuard";
import { ProtectedRoute } from "./components/guards/ProtectedRoute";
import { FinancialManagementPage } from "./features/admin/FinancialManagementPage";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { AuthLayout } from "./layouts/auth/AuthLayout";
import { OrgAdminLayout } from "./layouts/org-admin/OrgAdminLayout";
import { PlatformAdminLayout } from "./layouts/platform-admin/PlatformAdminLayout";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AuditLogPage } from "./pages/admin/AuditLogPage";
import { EmailInsightsPage } from "./pages/admin/EmailInsightsPage";
import { GlobalOrganizationsPage } from "./pages/admin/GlobalOrganizationsPage";
import { GlobalUsersPage } from "./pages/admin/GlobalUsersPage";
import { EmailVerificationPendingPage } from "./pages/auth/EmailVerificationPendingPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { SignInPage } from "./pages/auth/SignInPage";
import { SignUpPage } from "./pages/auth/SignUpPage";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";
import { BillingAccountsPage } from "./pages/dashboard/billing/BillingAccountsPage";
import { BillingPlansPage } from "./pages/dashboard/billing/BillingPlansPage";
import { BillingTransactionsPage } from "./pages/dashboard/billing/BillingTransactionsPage";
import { LessonsPage } from "./pages/dashboard/lessons/LessonsPage";
import { MoviesPage } from "./pages/dashboard/movies/MoviesPage";
import { OrdersPage } from "./pages/dashboard/orders/OrdersPage";
import { ProfilePage } from "./pages/dashboard/profile/ProfilePage";
import { SessionsPage } from "./pages/dashboard/sessions/SessionsPage";
import { ChangePasswordPage } from "./pages/dashboard/settings/ChangePasswordPage";
import { SettingsPage } from "./pages/dashboard/settings/SettingsPage";
import { ShopPage } from "./pages/dashboard/shop/ShopPage";
import { WalletPage } from "./pages/dashboard/wallet/WalletPage";
import { NotFoundPage } from "./pages/error/NotFoundPage";
import { UnauthorizedPage } from "./pages/error/UnauthorizedPage";
import { HomePage } from "./pages/home/HomePage";
import { AcceptInvitationPage } from "./pages/onboarding/AcceptInvitationPage";
import { NoOrganizationPage } from "./pages/onboarding/NoOrganizationPage";
import { SelectOrganizationPage } from "./pages/onboarding/SelectOrganizationPage";
import { MemberImportExportPage } from "./pages/organization/MemberImportExportPage";
import { OrganizationAnalyticsPage } from "./pages/organization/OrganizationAnalyticsPage";
import { OrganizationInvitationsPage } from "./pages/organization/OrganizationInvitationsPage";
import { OrganizationListPage } from "./pages/organization/OrganizationListPage";
import { OrganizationMediaPage } from "./pages/organization/OrganizationMediaPage";
import { OrganizationMembersPage } from "./pages/organization/OrganizationMembersPage";
import { OrganizationPlaylistsPage } from "./pages/organization/OrganizationPlaylistsPage";
import { OrganizationSchedulePage } from "./pages/organization/OrganizationSchedulePage";
import { OrganizationUploadsPage } from "./pages/organization/OrganizationUploadsPage";
import { PlaylistPlayerPage } from "./pages/organization/PlaylistPlayerPage";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 min — treat fresh data as fresh
            refetchOnWindowFocus: false, // don't restart spinners on tab switch
            retry: 1,
        },
    },
});

function logError(error: unknown, info: { componentStack?: string | null }) {
    console.error("Error Boundary caught an error:", error, info);
}

import { useHomeRedirect } from "./features/auth/hooks/useHomeRedirect";

function HomeRedirect() {
    useHomeRedirect();
    return <CenteredSpin />;
}

export default function App() {
    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={logError}
            onReset={() => {
                window.location.href = "/";
            }}
        >
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <div className="flex h-[calc(100dvh)] m-0 p-0">
                        <Routes>
                            <Route path="/" element={<HomeRedirect />} />

                            <Route path="/auth" element={<AuthLayout />}>
                                <Route path="verify-email" element={<VerifyEmailPage />} />
                                <Route
                                    path="email-verification-pending"
                                    element={<EmailVerificationPendingPage />}
                                />
                            </Route>

                            <Route element={<GuestRoute />}>
                                <Route path="/auth" element={<AuthLayout />}>
                                    <Route path="sign-in" element={<SignInPage />} />
                                    <Route path="sign-up" element={<SignUpPage />} />
                                    <Route
                                        path="forgot-password"
                                        element={<ForgotPasswordPage />}
                                    />
                                    <Route path="reset-password" element={<ResetPasswordPage />} />
                                </Route>
                            </Route>

                            <Route element={<ProtectedRoute />}>
                                <Route path={AppRoutes.onboarding.index} element={<AuthLayout />}>
                                    <Route
                                        path="no-organization"
                                        element={<NoOrganizationPage />}
                                    />
                                    <Route
                                        path="select-organization"
                                        element={<SelectOrganizationPage />}
                                    />
                                    <Route
                                        path="accept-invitation"
                                        element={<AcceptInvitationPage />}
                                    />
                                </Route>

                                <Route path="org/:slug" element={<OrgGuard />}>
                                    <Route element={<OrgAdminLayout />}>
                                        <Route
                                            index
                                            element={<Navigate to="dashboard" replace />}
                                        />

                                        <Route path="dashboard">
                                            <Route index element={<HomePage />} />
                                            <Route path="profile" element={<ProfilePage />} />
                                            <Route path="sessions" element={<SessionsPage />} />
                                            <Route path="settings" element={<SettingsPage />} />
                                            <Route
                                                path="change-password"
                                                element={<ChangePasswordPage />}
                                            />
                                            <Route path="lessons" element={<LessonsPage />} />
                                            <Route path="shop" element={<ShopPage />} />
                                            <Route path="wallet" element={<WalletPage />} />
                                            <Route path="movies" element={<MoviesPage />} />
                                            <Route path="orders" element={<OrdersPage />} />
                                        </Route>

                                        {/* ── ADMIN: restricted to true organization managers ── */}
                                        <Route
                                            element={
                                                <ProtectedRoute
                                                    allowedOrgRoles={["admin", "owner"]}
                                                />
                                            }
                                        >
                                            <Route path="admin">
                                                <Route
                                                    index
                                                    element={<OrganizationAnalyticsPage />}
                                                />
                                                <Route
                                                    path="media"
                                                    element={<OrganizationMediaPage />}
                                                />
                                                <Route
                                                    path="playlists"
                                                    element={<OrganizationPlaylistsPage />}
                                                />
                                                <Route
                                                    path="playlists/:playlistId"
                                                    element={<PlaylistPlayerPage />}
                                                />
                                                <Route
                                                    path="schedule"
                                                    element={<OrganizationSchedulePage />}
                                                />
                                                <Route
                                                    path="analytics"
                                                    element={<OrganizationAnalyticsPage />}
                                                />
                                                <Route
                                                    path="members"
                                                    element={<OrganizationMembersPage />}
                                                />
                                                <Route
                                                    path="invitations"
                                                    element={<OrganizationInvitationsPage />}
                                                />
                                                <Route
                                                    path="bulk"
                                                    element={<MemberImportExportPage />}
                                                />
                                                <Route
                                                    path="organizations"
                                                    element={<OrganizationListPage />}
                                                />
                                                <Route
                                                    path="uploads"
                                                    element={<OrganizationUploadsPage />}
                                                />
                                                <Route path="billing">
                                                    <Route
                                                        index
                                                        element={<Navigate to="accounts" replace />}
                                                    />
                                                    <Route
                                                        path="accounts"
                                                        element={<BillingAccountsPage />}
                                                    />
                                                    <Route
                                                        path="plans"
                                                        element={<BillingPlansPage />}
                                                    />
                                                    <Route
                                                        path="transactions"
                                                        element={<BillingTransactionsPage />}
                                                    />
                                                </Route>
                                            </Route>
                                        </Route>

                                        {/* ── TEACHING: staff tools for teachers and admins ── */}
                                        <Route
                                            element={
                                                <ProtectedRoute
                                                    allowedOrgRoles={["admin", "owner", "teacher"]}
                                                />
                                            }
                                        >
                                            <Route path="teaching">
                                                <Route
                                                    index
                                                    element={<Navigate to="schedule" replace />}
                                                />
                                                <Route
                                                    path="schedule"
                                                    element={<OrganizationSchedulePage />}
                                                />
                                                <Route
                                                    path="media"
                                                    element={<OrganizationMediaPage />}
                                                />
                                                <Route
                                                    path="playlists"
                                                    element={<OrganizationPlaylistsPage />}
                                                />
                                                <Route
                                                    path="playlists/:playlistId"
                                                    element={<PlaylistPlayerPage />}
                                                />
                                                <Route
                                                    path="students"
                                                    element={<OrganizationMembersPage />}
                                                />
                                            </Route>
                                        </Route>
                                    </Route>
                                </Route>

                                <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                                    <Route element={<PlatformAdminLayout />}>
                                        <Route path="admin" element={<AdminDashboardPage />} />
                                        <Route path="admin/users" element={<GlobalUsersPage />} />
                                        <Route
                                            path="admin/organizations"
                                            element={<GlobalOrganizationsPage />}
                                        />
                                        <Route
                                            path="admin/emails"
                                            element={<EmailInsightsPage />}
                                        />
                                        <Route
                                            path="admin/billing"
                                            element={<FinancialManagementPage />}
                                        />
                                        <Route path="admin/audit-logs" element={<AuditLogPage />} />
                                    </Route>
                                </Route>
                            </Route>

                            <Route element={<AuthLayout />}>
                                <Route
                                    path={AppRoutes.unauthorized}
                                    element={<UnauthorizedPage />}
                                />
                                <Route path="*" element={<NotFoundPage />} />
                            </Route>
                        </Routes>
                    </div>
                </AuthProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}
