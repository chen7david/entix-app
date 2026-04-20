import { AppRoutes } from "@shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Navigate, Route, Routes } from "react-router";
import { CenteredSpin } from "./components/common/CenteredView";
import { ErrorFallback } from "./components/error/ErrorFallback";
import { GuestRoute, OrgGuard, ProtectedRoute } from "./components/guards";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { useHomeRedirect } from "./features/auth/hooks/useHomeRedirect";
import { useTimezoneInit } from "./hooks/useTimezoneInit";
import { AuthLayout } from "./layouts/auth/AuthLayout";
import { OrgAdminLayout } from "./layouts/org-admin/OrgAdminLayout";
import { PlatformAdminLayout } from "./layouts/platform-admin/PlatformAdminLayout";
import { QUERY_STALE_MS } from "./lib/query-config";
import {
    AcceptInvitationPage,
    AdminDashboardPage,
    AuditLogPage,
    BillingAccountsPage,
    BillingPlansPage,
    BillingTransactionsPage,
    ChangePasswordPage,
    EmailInsightsPage,
    EmailVerificationPendingPage,
    FinancialManagementPage,
    ForgotPasswordPage,
    GlobalOrganizationsPage,
    GlobalUsersPage,
    HomePage,
    LessonsPage,
    MemberImportExportPage,
    MoviesPage,
    NoOrganizationPage,
    NotFoundPage,
    OrdersPage,
    OrganizationAnalyticsPage,
    OrganizationInvitationsPage,
    OrganizationListPage,
    OrganizationMediaPage,
    OrganizationMembersPage,
    OrganizationPlaylistsPage,
    OrganizationSchedulePage,
    OrganizationUploadsPage,
    PlaylistPlayerPage,
    ProfilePage,
    ResetPasswordPage,
    SelectOrganizationPage,
    SessionsPage,
    SettingsPage,
    ShopPage,
    SignInPage,
    SignUpPage,
    UnauthorizedPage,
    VerifyEmailPage,
    WalletPage,
} from "./routes/lazy-pages";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: QUERY_STALE_MS,
            refetchOnWindowFocus: false, // don't restart spinners on tab switch
            retry: 1,
        },
    },
});

function logError(error: unknown, info: { componentStack?: string | null }) {
    console.error("Error Boundary caught an error:", error, info);
}

function HomeRedirect() {
    useHomeRedirect();
    return <CenteredSpin />;
}

function PreferenceSync() {
    useTimezoneInit();
    return null;
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
                    <PreferenceSync />
                    <Suspense fallback={<CenteredSpin />}>
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
                                        <Route
                                            path="reset-password"
                                            element={<ResetPasswordPage />}
                                        />
                                    </Route>
                                </Route>

                                <Route element={<ProtectedRoute />}>
                                    <Route
                                        path={AppRoutes.onboarding.index}
                                        element={<AuthLayout />}
                                    >
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
                                                            element={
                                                                <Navigate to="accounts" replace />
                                                            }
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
                                                        allowedOrgRoles={[
                                                            "admin",
                                                            "owner",
                                                            "teacher",
                                                        ]}
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
                                            <Route
                                                path="admin/users"
                                                element={<GlobalUsersPage />}
                                            />
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
                                            <Route
                                                path="admin/audit-logs"
                                                element={<AuditLogPage />}
                                            />
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
                    </Suspense>
                </AuthProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}
