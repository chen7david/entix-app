import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@pages/HomePage';
import { LoginPage } from '@pages/LoginPage';
import { SignUpPage } from '@pages/SignUpPage';
import { ConfirmSignUpPage } from '@pages/ConfirmSignUpPage';
import { ForgotPasswordPage } from '@pages/ForgotPasswordPage';
import { ConfirmPasswordResetPage } from '@pages/ConfirmPasswordResetPage';
import { PublicLayout } from '@layouts/PublicLayout';
import { DashboardLayout } from '@layouts/DashboardLayout';
import { ProfilePage } from '@pages/ProfilePage';
import { ProtectedRoute } from '@components/ProtectedRoute';
import { NotFoundPage } from '@pages/error/NotFoundPage';
import { UnauthorizedPage } from '@pages/error/UnauthorizedPage';
import UsersPage from '@pages/UsersPage';
import RolesPage from '@pages/RolesPage';
import PermissionsPage from '@pages/PermissionsPage';

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Public routes - accessible only to non-authenticated users */}
      <Route path="/auth" element={<PublicLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignUpPage />} />
        <Route path="confirm-signup" element={<ConfirmSignUpPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="confirm-password-reset" element={<ConfirmPasswordResetPage />} />
      </Route>

      {/* Dashboard routes with sidebar - authenticated users only */}
      <Route
        path="/auth"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Dashboard routes for management pages */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="permissions" element={<PermissionsPage />} />
      </Route>

      {/* Error pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      {/* Catch-all route for 404 Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
