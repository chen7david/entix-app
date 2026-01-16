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
import { OrganizationListPage } from "./pages/dashboard/organization/OrganizationListPage";
import { CreateOrganizationPage } from "./pages/dashboard/organization/CreateOrganizationPage";
import { InviteMemberPage } from "./pages/dashboard/organization/InviteMemberPage";
import { AcceptInvitationPage } from "./pages/auth/AcceptInvitationPage";
import { MembersPage } from "./pages/dashboard/organization/MembersPage";
import { InvitationsPage } from "./pages/dashboard/organization/InvitationsPage";
import { AuthLayout } from "./layouts/AuthLayout";
import { links } from "./constants/links";
import { AppContainer } from "./components/containers/AppContainer";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { DashboardPage } from "./pages/dashboard/dashboard/DashboardPage";

import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";
import { EmailVerificationPendingPage } from "./pages/auth/EmailVerificationPendingPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContainer>
        <Routes>
          <Route path="/" element={<Navigate to={links.auth.signIn} replace />} />
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="sign-in" element={<SignInPage />} />
            <Route path="sign-up" element={<SignUpPage />} />
            <Route path="verify-email" element={<VerifyEmailPage />} />
            <Route path="email-verification-pending" element={<EmailVerificationPendingPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route path="accept-invitation" element={<AcceptInvitationPage />} />
          </Route>
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
            <Route path='organizations' element={<OrganizationListPage />} />
            <Route path='organizations/create' element={<CreateOrganizationPage />} />
            <Route path='organizations/invite' element={<InviteMemberPage />} />
          </Route>
        </Routes>
      </AppContainer>
    </QueryClientProvider>
  )
}