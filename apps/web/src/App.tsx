import { Routes, Route, Navigate } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import { LoginPage } from '@features/auth';
import { UsersPage } from '@features/users';
import { SignUpPage } from '@pages/SignUpPage';
import { ConfirmSignUpPage } from '@pages/ConfirmSignUpPage';
import { ForgotPasswordPage } from '@pages/ForgotPasswordPage';
import { ConfirmPasswordResetPage } from '@pages/ConfirmPasswordResetPage';
import { DebugLoginPage } from '@pages/DebugLoginPage';
import { PublicLayout } from '@layouts/PublicLayout';
import { DashboardLayout } from '@layouts/DashboardLayout';
import { ProfilePage } from '@pages/ProfilePage';
import { ProtectedRoute } from '@shared/components';
import { NotFoundPage } from '@pages/error/NotFoundPage';
import { UnauthorizedPage } from '@pages/error/UnauthorizedPage';
import RolesPage from '@pages/RolesPage';
import PermissionsPage from '@pages/PermissionsPage';

export const App = () => {
  return (
    <AntdApp>
      <Routes>
        <Route path="/" element={<Navigate to="/auth/login" />} />

        {/* Debug route for testing authentication */}
        <Route path="/debug/login" element={<DebugLoginPage />} />

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
    </AntdApp>
  );
};
