import { type ComponentType, lazy } from "react";

/** Lazy-load a module's **default** export (must be a React component). */
function lazyDefault<T extends ComponentType<object>>(importer: () => Promise<{ default: T }>) {
    return lazy(importer);
}

/** Lazy-load a **named** page export as the default for `React.lazy`. */
function lazyNamed<T extends ComponentType<object>>(
    importer: () => Promise<Record<string, ComponentType<object>>>,
    exportName: string
) {
    return lazy(() =>
        importer().then((m) => ({
            default: m[exportName] as T,
        }))
    );
}

// —— Auth & onboarding ——
export const VerifyEmailPage = lazyNamed(
    () => import("@web/src/pages/auth/VerifyEmailPage"),
    "VerifyEmailPage"
);
export const EmailVerificationPendingPage = lazyNamed(
    () => import("@web/src/pages/auth/EmailVerificationPendingPage"),
    "EmailVerificationPendingPage"
);
export const SignInPage = lazyNamed(() => import("@web/src/pages/auth/SignInPage"), "SignInPage");
export const SignUpPage = lazyNamed(() => import("@web/src/pages/auth/SignUpPage"), "SignUpPage");
export const ForgotPasswordPage = lazyNamed(
    () => import("@web/src/pages/auth/ForgotPasswordPage"),
    "ForgotPasswordPage"
);
export const ResetPasswordPage = lazyNamed(
    () => import("@web/src/pages/auth/ResetPasswordPage"),
    "ResetPasswordPage"
);
export const NoOrganizationPage = lazyNamed(
    () => import("@web/src/pages/onboarding/NoOrganizationPage"),
    "NoOrganizationPage"
);
export const SelectOrganizationPage = lazyNamed(
    () => import("@web/src/pages/onboarding/SelectOrganizationPage"),
    "SelectOrganizationPage"
);
export const AcceptInvitationPage = lazyNamed(
    () => import("@web/src/pages/onboarding/AcceptInvitationPage"),
    "AcceptInvitationPage"
);

// —— Dashboard (org member) ——
export const HomePage = lazyDefault(() => import("@web/src/pages/home/HomePage"));
export const ProfilePage = lazyNamed(
    () => import("@web/src/pages/dashboard/profile/ProfilePage"),
    "ProfilePage"
);
export const SessionsPage = lazyNamed(
    () => import("@web/src/pages/dashboard/sessions/SessionsPage"),
    "SessionsPage"
);
export const SettingsPage = lazyDefault(
    () => import("@web/src/pages/dashboard/settings/SettingsPage")
);
export const ChangePasswordPage = lazyNamed(
    () => import("@web/src/pages/dashboard/settings/ChangePasswordPage"),
    "ChangePasswordPage"
);
export const LessonsPage = lazyNamed(
    () => import("@web/src/pages/dashboard/lessons/LessonsPage"),
    "LessonsPage"
);
export const ShopPage = lazyNamed(
    () => import("@web/src/pages/dashboard/shop/ShopPage"),
    "ShopPage"
);
export const WalletPage = lazyDefault(() => import("@web/src/pages/dashboard/wallet/WalletPage"));
export const MoviesPage = lazyNamed(
    () => import("@web/src/pages/dashboard/movies/MoviesPage"),
    "MoviesPage"
);
export const OrdersPage = lazyNamed(
    () => import("@web/src/pages/dashboard/orders/OrdersPage"),
    "OrdersPage"
);

// —— Org admin / teaching ——
export const OrganizationAnalyticsPage = lazyNamed(
    () => import("@web/src/pages/organization/OrganizationAnalyticsPage"),
    "OrganizationAnalyticsPage"
);
export const OrganizationMediaPage = lazyNamed(
    () => import("@web/src/pages/organization/OrganizationMediaPage"),
    "OrganizationMediaPage"
);
export const OrganizationPlaylistsPage = lazyNamed(
    () => import("@web/src/pages/organization/OrganizationPlaylistsPage"),
    "OrganizationPlaylistsPage"
);
export const PlaylistPlayerPage = lazyNamed(
    () => import("@web/src/pages/organization/PlaylistPlayerPage"),
    "PlaylistPlayerPage"
);
export const OrganizationSchedulePage = lazyNamed(
    () => import("@web/src/pages/organization/OrganizationSchedulePage"),
    "OrganizationSchedulePage"
);
export const OrganizationSessionMeetingPage = lazyNamed(
    () => import("@web/src/pages/organization/OrganizationSessionMeetingPage"),
    "OrganizationSessionMeetingPage"
);
export const OrganizationMembersPage = lazyNamed(
    () => import("@web/src/pages/organization/OrganizationMembersPage"),
    "OrganizationMembersPage"
);
export const OrganizationInvitationsPage = lazyNamed(
    () => import("@web/src/pages/organization/OrganizationInvitationsPage"),
    "OrganizationInvitationsPage"
);
export const MemberImportExportPage = lazyNamed(
    () => import("@web/src/pages/organization/MemberImportExportPage"),
    "MemberImportExportPage"
);
export const OrganizationListPage = lazyNamed(
    () => import("@web/src/pages/organization/OrganizationListPage"),
    "OrganizationListPage"
);
export const OrganizationUploadsPage = lazyNamed(
    () => import("@web/src/pages/organization/OrganizationUploadsPage"),
    "OrganizationUploadsPage"
);
export const BillingAccountsPage = lazyNamed(
    () => import("@web/src/pages/dashboard/billing/BillingAccountsPage"),
    "BillingAccountsPage"
);
export const BillingPlansPage = lazyNamed(
    () => import("@web/src/pages/dashboard/billing/BillingPlansPage"),
    "BillingPlansPage"
);
export const BillingTransactionsPage = lazyNamed(
    () => import("@web/src/pages/dashboard/billing/BillingTransactionsPage"),
    "BillingTransactionsPage"
);

// —— Platform admin ——
export const AdminDashboardPage = lazyNamed(
    () => import("@web/src/pages/admin/AdminDashboardPage"),
    "AdminDashboardPage"
);
export const GlobalUsersPage = lazyNamed(
    () => import("@web/src/pages/admin/GlobalUsersPage"),
    "GlobalUsersPage"
);
export const GlobalOrganizationsPage = lazyNamed(
    () => import("@web/src/pages/admin/GlobalOrganizationsPage"),
    "GlobalOrganizationsPage"
);
export const EmailInsightsPage = lazyNamed(
    () => import("@web/src/pages/admin/EmailInsightsPage"),
    "EmailInsightsPage"
);
export const FinancialManagementPage = lazyNamed(
    () => import("@web/src/features/admin/FinancialManagementPage"),
    "FinancialManagementPage"
);
export const AuditLogPage = lazyNamed(
    () => import("@web/src/pages/admin/AuditLogPage"),
    "AuditLogPage"
);

// —— Errors (auth layout shell) ——
export const UnauthorizedPage = lazyNamed(
    () => import("@web/src/pages/error/UnauthorizedPage"),
    "UnauthorizedPage"
);
export const NotFoundPage = lazyNamed(
    () => import("@web/src/pages/error/NotFoundPage"),
    "NotFoundPage"
);
