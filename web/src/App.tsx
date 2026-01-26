import { Routes, Route, Navigate } from "react-router";
import { SignUpPage } from "./pages/auth/SignUpPage";
import { SignInPage } from "./pages/auth/SignInPage";
import { ProfilePage } from "./pages/dashboard/profile/ProfilePage";
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
import { DashboardPage } from "./pages/dashboard/dashboard/DashboardPage";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";
import { EmailVerificationPendingPage } from "./pages/auth/EmailVerificationPendingPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { OrganizationListPage } from "./pages/organization/OrganizationListPage";
import { OrganizationDashboardPage } from "./pages/organization/OrganizationDashboardPage";
import { OrganizationMembersPage } from "./pages/organization/OrganizationMembersPage";
import { OrganizationInvitationsPage } from "./pages/organization/OrganizationInvitationsPage";
import { NoOrganizationPage } from "./pages/auth/NoOrganizationPage";
import { SelectOrganizationPage } from "./pages/auth/SelectOrganizationPage";
import { AcceptInvitationPage } from "./pages/auth/AcceptInvitationPage";
import { AuthGuard } from "./components/guards/AuthGuard";
import { GuestGuard } from "./components/guards/GuestGuard";
import { OrganizationGuard } from "./components/guards/OrganizationGuard";
import { OrganizationSlugGuard } from "./components/guards/OrganizationSlugGuard";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContainer>
        <Routes>
          <Route path="/" element={<Navigate to={links.auth.signIn} replace />} />

          {/* Public Routes (Guest Only) */}
          <Route element={<GuestGuard />}>
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="sign-in" element={<SignInPage />} />
              <Route path="sign-up" element={<SignUpPage />} />
              <Route path="verify-email" element={<VerifyEmailPage />} />
              <Route path="email-verification-pending" element={<EmailVerificationPendingPage />} />
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

            {/* Organization Protected Routes */}
            <Route element={<OrganizationGuard />}>
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
              </Route>

              {/* Dashboard Routes */}
              <Route path={links.dashboard.index} element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path='profile' element={<ProfilePage />} />
                <Route path='settings' element={<SettingsPage />} />
                <Route path='change-password' element={<ChangePasswordPage />} />
                <Route path='lessons' element={<LessonsPage />} />
                <Route path='shop' element={<ShopPage />} />
                <Route path='wallet' element={<WalletPage />} />
                <Route path='movies' element={<MoviesPage />} />
                <Route path='orders' element={<OrdersPage />} />
              </Route>

              {/* Organization Routes */}
              <Route path={links.organization.index} element={<DashboardLayout />}>
                <Route index element={<OrganizationListPage />} />
                <Route path=":slug" element={<OrganizationSlugGuard />}>
                  <Route index element={<OrganizationDashboardPage />} />
                  <Route path="members" element={<OrganizationMembersPage />} />
                  <Route path="invitations" element={<OrganizationInvitationsPage />} />
                </Route>
              </Route>
            </Route>
          </Route>
        </Routes>
      </AppContainer>
    </QueryClientProvider>
  )
}