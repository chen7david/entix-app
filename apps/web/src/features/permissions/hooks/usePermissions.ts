import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { apiClient } from '@/lib/api-client';
import { usePermissions as useAuthPermissions } from '@/features/auth/hooks/useAuth';
import { PermissionCode } from '@repo/entix-sdk';
import type { Permission, CreatePermissionParamsDto, UpdatePermissionParamsDto } from '@repo/entix-sdk';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

/**
 * Hook for managing permissions business logic
 * Handles CRUD operations and permission roles
 */
export const usePermissions = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthPermissions();
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

  // Queries
  const {
    data: permissions = [],
    isLoading: permissionsLoading,
    refetch: refetchPermissions,
  } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiClient.permissions.getPermissions(),
    enabled: hasPermission(PermissionCode.GET_PERMISSIONS),
  });

  const { data: permissionRoles = [] } = useQuery({
    queryKey: ['permission-roles', selectedPermission?.id],
    queryFn: () =>
      selectedPermission ? apiClient.permissions.getPermissionRoles(selectedPermission.id) : Promise.resolve([]),
    enabled: !!selectedPermission && hasPermission(PermissionCode.GET_PERMISSION_ROLES),
  });

  // Mutations
  const createPermissionMutation = useMutation({
    mutationFn: (permissionData: CreatePermissionParamsDto) => apiClient.permissions.createPermission(permissionData),
    onSuccess: () => {
      message.success('Permission created successfully');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
    onError: (error: Error) => {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || 'Failed to create permission');
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ id, permissionData }: { id: string; permissionData: UpdatePermissionParamsDto }) =>
      apiClient.permissions.updatePermission(id, permissionData),
    onSuccess: () => {
      message.success('Permission updated successfully');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setSelectedPermission(null);
    },
    onError: (error: Error) => {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || 'Failed to update permission');
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: (permissionId: string) => apiClient.permissions.deletePermission(permissionId),
    onSuccess: () => {
      message.success('Permission deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
    onError: (error: Error) => {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || 'Failed to delete permission');
    },
  });

  // Actions
  const createPermission = async (permissionData: CreatePermissionParamsDto): Promise<void> => {
    await createPermissionMutation.mutateAsync(permissionData);
  };

  const updatePermission = async (id: string, permissionData: UpdatePermissionParamsDto): Promise<void> => {
    await updatePermissionMutation.mutateAsync({ id, permissionData });
  };

  const deletePermission = async (permissionId: string): Promise<void> => {
    await deletePermissionMutation.mutateAsync(permissionId);
  };

  const selectPermission = (permission: Permission | null): void => {
    setSelectedPermission(permission);
  };

  // Get next available permission code
  const getNextPermissionCode = (): number => {
    if (permissions.length === 0) return 1;
    const maxCode = Math.max(...permissions.map((p: Permission) => p.permissionCode));
    return maxCode + 1;
  };

  return {
    // Data
    permissions,
    permissionRoles,
    selectedPermission,

    // Loading states
    permissionsLoading,
    isCreating: createPermissionMutation.isPending,
    isUpdating: updatePermissionMutation.isPending,
    isDeleting: deletePermissionMutation.isPending,

    // Actions
    createPermission,
    updatePermission,
    deletePermission,
    selectPermission,
    refetchPermissions,
    getNextPermissionCode,
  };
};
