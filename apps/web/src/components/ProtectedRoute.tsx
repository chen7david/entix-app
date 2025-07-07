import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, usePermissions } from '@/hooks/auth.hook';
import { UnauthorizedPage } from '@pages/error/UnauthorizedPage';

type ProtectedRouteProps = {
  /** Content to render when user is authenticated and authorized */
  children: ReactNode;
  /** Single permission code required */
  permission?: number;
  /** Array of permission codes - user needs ANY of these */
  anyPermissions?: number[];
  /** Array of permission codes - user needs ALL of these */
  allPermissions?: number[];
  /** Redirect path when user is not authenticated */
  redirectTo?: string;
};

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
