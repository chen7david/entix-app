import { Navigate } from 'react-router-dom';
import { useAuth, usePermissions } from '@/features/auth/hooks/useAuth';
import { UnauthorizedPage } from '@/features/error';
import type { ProtectedRouteProps } from '../types/navigation.types';

/**
 * ProtectedRoute component for route-level authentication and authorization
 *
 * @example
 * // Require authentication only
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * @example
 * // Require specific permission
 * <ProtectedRoute permission={PermissionCode.GET_USERS}>
 *   <UsersPage />
 * </ProtectedRoute>
 *
 * @example
 * // Require any of multiple permissions
 * <ProtectedRoute anyPermissions={[PermissionCode.CREATE_ROLE, PermissionCode.UPDATE_ROLE]}>
 *   <RoleManagementPage />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({
  children,
  permission,
  anyPermissions,
  allPermissions,
  redirectTo = '/auth/login',
}: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Check authentication first
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check specific permission
  if (permission !== undefined && !hasPermission(permission)) {
    return <UnauthorizedPage />;
  }

  // Check any permissions
  if (anyPermissions !== undefined && !hasAnyPermission(anyPermissions)) {
    return <UnauthorizedPage />;
  }

  // Check all permissions
  if (allPermissions !== undefined && !hasAllPermissions(allPermissions)) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};
