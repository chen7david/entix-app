import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@pages/HomePage';
import { LoginPage } from '@pages/LoginPage';
import { AuthLayout } from '@layouts/AuthLayout';
import { ProfilePage } from '@pages/ProfilePage';
import { ProtectedRoute } from '@components/ProtectedRoute';
import { NotFoundPage } from '@pages/error/NotFoundPage';
import { UnauthorizedPage } from '@pages/error/UnauthorizedPage';

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>
      {/* Error pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      {/* Catch-all route for 404 Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
