import { usePermissions } from '@/features/auth/hooks/useAuth';
import type { PermissionGuardProps } from '../types/navigation.types';

/**
 * PermissionGuard component for conditional rendering based on user permissions
 *
 * @example
 * // Require single permission
 * <PermissionGuard permission={PermissionCode.GET_USERS}>
 *   <UsersList />
 * </PermissionGuard>
 *
 * @example
 * // Require any of multiple permissions
 * <PermissionGuard anyPermissions={[PermissionCode.CREATE_ROLE, PermissionCode.UPDATE_ROLE]}>
 *   <RoleManagement />
 * </PermissionGuard>
 *
 * @example
 * // With fallback content
 * <PermissionGuard
 *   permission={PermissionCode.GET_USERS}
 *   fallback={<div>You don't have permission to view users</div>}
 * >
 *   <UsersList />
 * </PermissionGuard>
 */
export const PermissionGuard = ({
  permission,
  anyPermissions,
  allPermissions,
  children,
  fallback = null,
}: PermissionGuardProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Check single permission
  if (permission !== undefined) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Check any permissions
  if (anyPermissions !== undefined) {
    return hasAnyPermission(anyPermissions) ? <>{children}</> : <>{fallback}</>;
  }

  // Check all permissions
  if (allPermissions !== undefined) {
    return hasAllPermissions(allPermissions) ? <>{children}</> : <>{fallback}</>;
  }

  // If no permission checks specified, render children
  return <>{children}</>;
};
