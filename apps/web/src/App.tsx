import { Routes, Route, Navigate } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import {
  LoginPage,
  SignUpPage,
  ConfirmSignUpPage,
  ForgotPasswordPage,
  ConfirmPasswordResetPage,
} from '@/features/auth';
import { PublicLayout, DashboardLayout } from '@/shared/components/layout';
import { ProfilePage } from '@/features/profile';
import { ProtectedRoute } from '@/features/navigation';
import { NotFoundPage, UnauthorizedPage } from '@/features/error';
import { UsersPage } from '@/features/users';
import { RolesPage } from '@/features/roles';
import { PermissionsPage } from '@/features/permissions';

export const App = () => {
  return (
    <AntdApp>
      <Routes>
        <Route path="/" element={<Navigate to="/auth/login" />} />

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
