import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth, usePermissions } from '@/hooks/auth.hook';
import { PermissionCode } from '@repo/entix-sdk';
import { PERMISSION_CHECKS } from '@/components/profile/constants';

/**
 * Enhanced hook for user permissions with React Query optimization
 */
export const useUserPermissions = () => {
  const { user } = useAuth();
  const { permissions, hasPermission } = usePermissions();

  /**
   * Query for user's current permissions
   * Using React Query for caching and automatic refetching
   */
  const {
    data: userPermissions = permissions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: (): Promise<number[]> => Promise.resolve(permissions), // Already available from auth context
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
  });

  /**
   * Memoized permission status calculations
   */
  const permissionStatus = useMemo(() => {
    return PERMISSION_CHECKS.map(check => ({
      label: check.label,
      permission: check.permission,
      hasAccess: hasPermission(PermissionCode[check.permission]),
    }));
  }, [hasPermission]);

  /**
   * Memoized permission tags data
   */
  const permissionTags = useMemo(() => {
    return (userPermissions as number[]).map((permissionCode: number) => ({
      code: permissionCode,
      name: PermissionCode[permissionCode] || `Code: ${permissionCode}`,
    }));
  }, [userPermissions]);

  /**
   * Check if user has any permissions
   */
  const hasAnyPermissions = useMemo(() => {
    return (userPermissions as number[]).length > 0;
  }, [userPermissions]);

  /**
   * Get permission count by category
   */
  const permissionStats = useMemo(() => {
    const total = (userPermissions as number[]).length;
    const granted = permissionStatus.filter(p => p.hasAccess).length;
    const denied = permissionStatus.length - granted;

    return {
      total,
      granted,
      denied,
      percentage: total > 0 ? Math.round((granted / permissionStatus.length) * 100) : 0,
    };
  }, [(userPermissions as number[]).length, permissionStatus]);

  return {
    // Data
    permissions: userPermissions as number[],
    permissionTags,
    permissionStatus,
    permissionStats,

    // State
    isLoading,
    error,
    hasAnyPermissions,

    // Methods
    hasPermission,
  };
};
