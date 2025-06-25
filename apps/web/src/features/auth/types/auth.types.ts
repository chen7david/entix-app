import type { PermissionCode } from '@repo/entix-sdk';
import type { getCurrentUserFromToken } from '@lib/jwt.utils';

/**
 * Authentication hook return types
 */

export type UseAuthReturn = {
  isAuthenticated: boolean;
  user: ReturnType<typeof getCurrentUserFromToken>;
  permissions: number[];
  isTokenExpired: () => boolean;
};

export type UsePermissionsReturn = {
  permissions: number[];
  hasPermission: (permission: PermissionCode) => boolean;
  hasAnyPermission: (permissions: PermissionCode[]) => boolean;
  hasAllPermissions: (permissions: PermissionCode[]) => boolean;
};
