import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { PublicRouteProps } from '../types/navigation.types';

/**
 * PublicRoute component for pages that should only be accessible to non-authenticated users
 * (e.g., login, signup, password reset pages)
 *
 * @example
 * <PublicRoute>
 *   <LoginPage />
 * </PublicRoute>
 *
 * @example
 * // Custom redirect for authenticated users
 * <PublicRoute redirectTo="/dashboard">
 *   <SignUpPage />
 * </PublicRoute>
 */
export const PublicRoute = ({ children, redirectTo = '/auth/profile' }: PublicRouteProps) => {
  const { isAuthenticated } = useAuth();

  // If user is authenticated, redirect them away from public pages
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
