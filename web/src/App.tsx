import { Routes, Route, Navigate } from "react-router";
import { SignUpPage } from "./pages/auth/SignUpPage";
import { SignInPage } from "./pages/auth/SignInPage";
import { ProfilePage } from "./pages/dashboard/profile/ProfilePage";
import { SessionsPage } from "./pages/dashboard/sessions/SessionsPage";
import { LessonsPage } from "./pages/dashboard/lessons/LessonsPage";
import { ShopPage } from "./pages/dashboard/shop/ShopPage";
import { WalletPage } from "./pages/dashboard/wallet/WalletPage";
import { MoviesPage } from "./pages/dashboard/movies/MoviesPage";
import { OrdersPage } from "./pages/dashboard/orders/OrdersPage";
import { SettingsPage } from "./pages/dashboard/settings/SettingsPage";
import { ChangePasswordPage } from "./pages/dashboard/settings/ChangePasswordPage";
import { AuthLayout } from "./layouts/AuthLayout";
import { links } from "./constants/links";
import { AppContainer } from "./components/containers/AppContainer";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";
import { EmailVerificationPendingPage } from "./pages/auth/EmailVerificationPendingPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { OrganizationListPage } from "./pages/organization/OrganizationListPage";
import { OrganizationMembersPage } from "./pages/organization/OrganizationMembersPage";
import { OrganizationInvitationsPage } from "./pages/organization/OrganizationInvitationsPage";
import { NoOrganizationPage } from "./pages/auth/NoOrganizationPage";
import { SelectOrganizationPage } from "./pages/auth/SelectOrganizationPage";
import { AcceptInvitationPage } from "./pages/auth/AcceptInvitationPage";
import { HomePage } from "./pages/home/HomePage";
import { AuthGuard } from "./components/guards/AuthGuard";
import { GuestGuard } from "./components/guards/GuestGuard";
import { AdminGuard } from "./components/guards/AdminGuard";
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './components/error/ErrorFallback';
import { NotFoundPage } from './pages/error/NotFoundPage';
import { OrgGuard } from './components/guards/OrgGuard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function logError(error: unknown, info: { componentStack?: string | null }) {
  // Log to console in development
  console.error('Error Boundary caught an error:', error, info);

  // TODO: In production, send to error logging service (e.g., Sentry, LogRocket)
  // Example: Sentry.captureException(error, { extra: info });
}

export default function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={logError}
      onReset={() => {
        // Reset application state if needed
        window.location.href = '/';
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AppContainer>
          <Routes>
            <Route path="/" element={<Navigate to={links.auth.signIn} replace />} />

            {/* Public routes (no guard) */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="verify-email" element={<VerifyEmailPage />} />
              <Route path="email-verification-pending" element={<EmailVerificationPendingPage />} />
            </Route>

            {/* Public Routes (Guest Only) */}
            <Route element={<GuestGuard />}>
              <Route path="/auth" element={<AuthLayout />}>
                <Route path="sign-in" element={<SignInPage />} />
                <Route path="sign-up" element={<SignUpPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password" element={<ResetPasswordPage />} />
              </Route>
            </Route>

            {/* Protected Routes */}
            <Route element={<AuthGuard />}>

              {/* Context Routes (Authenticated but no active org required) */}
              <Route path={links.context.index} element={<AuthLayout />}>
                <Route path="no-organization" element={<NoOrganizationPage />} />
                <Route path="select-organization" element={<SelectOrganizationPage />} />
                <Route path="accept-invitation" element={<AcceptInvitationPage />} />
              </Route>

              {/* URL-scoped Organization Routes: /org/:slug/... */}
              <Route path="org/:slug" element={<OrgGuard />}>
                {/* Org index - redirect to dashboard */}
                <Route index element={<Navigate to="dashboard" replace />} />
                {/* Dashboard Routes */}
                <Route path="dashboard" element={<DashboardLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path='profile' element={<ProfilePage />} />
                  <Route path='sessions' element={<SessionsPage />} />
                  <Route path='settings' element={<SettingsPage />} />
                  <Route path='change-password' element={<ChangePasswordPage />} />
                  <Route path='lessons' element={<LessonsPage />} />
                  <Route path='shop' element={<ShopPage />} />
                  <Route path='wallet' element={<WalletPage />} />
                  <Route path='movies' element={<MoviesPage />} />
                  <Route path='orders' element={<OrdersPage />} />
                  {/* Admin Routes */}
                  <Route element={<AdminGuard />}>
                    <Route path='admin' element={<AdminDashboardPage />} />
                  </Route>
                </Route>

                {/* Organization Management within the org context */}
                <Route path="members" element={<DashboardLayout />}>
                  <Route index element={<OrganizationMembersPage />} />
                </Route>
                <Route path="invitations" element={<DashboardLayout />}>
                  <Route index element={<OrganizationInvitationsPage />} />
                </Route>
                {/* Organization Management */}
                <Route path="organizations" element={<DashboardLayout />}>
                  <Route index element={<OrganizationListPage />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all 404 route */}


            <Route element={<AuthLayout />}>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AppContainer>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}