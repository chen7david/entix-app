import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { apiClient } from '@/lib/api-client';
import { usePermissions } from '@/features/auth/hooks/use-auth';
import { PermissionCode } from '@repo/entix-sdk';
import type { Role, CreateRoleParamsDto, UpdateRoleParamsDto } from '@repo/entix-sdk';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

/**
 * Hook for managing roles business logic
 * Handles CRUD operations, permissions assignment, and role users
 */
export const useRoles = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Queries
  const {
    data: roles = [],
    isLoading: rolesLoading,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiClient.roles.getRoles(),
    enabled: hasPermission(PermissionCode.GET_ROLES),
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiClient.permissions.getPermissions(),
    enabled: hasPermission(PermissionCode.GET_PERMISSIONS),
  });

  const { data: rolePermissions = [], refetch: refetchRolePermissions } = useQuery({
    queryKey: ['role-permissions', selectedRole?.id],
    queryFn: () => (selectedRole ? apiClient.roles.getRolePermissions(selectedRole.id) : Promise.resolve([])),
    enabled: !!selectedRole && hasPermission(PermissionCode.GET_ROLE_PERMISSIONS),
  });

  const { data: roleUsers = [] } = useQuery({
    queryKey: ['role-users', selectedRole?.id],
    queryFn: () => (selectedRole ? apiClient.roles.getRoleUsers(selectedRole.id) : Promise.resolve([])),
    enabled: !!selectedRole && hasPermission(PermissionCode.GET_ROLE_USERS),
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: (roleData: CreateRoleParamsDto) => apiClient.roles.createRole(roleData),
    onSuccess: () => {
      message.success('Role created successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: Error) => {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || 'Failed to create role');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, roleData }: { id: string; roleData: UpdateRoleParamsDto }) =>
      apiClient.roles.updateRole(id, roleData),
    onSuccess: () => {
      message.success('Role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSelectedRole(null);
    },
    onError: (error: Error) => {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || 'Failed to update role');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => apiClient.roles.deleteRole(roleId),
    onSuccess: () => {
      message.success('Role deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: Error) => {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || 'Failed to delete role');
    },
  });

  const assignPermissionMutation = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      apiClient.rolePermissions.createRolePermission({ roleId, permissionId }),
    onSuccess: () => {
      message.success('Permission assigned successfully');
      refetchRolePermissions();
    },
    onError: (error: Error) => {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || 'Failed to assign permission');
    },
  });

  const removePermissionMutation = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      apiClient.rolePermissions.deleteRolePermission({ roleId, permissionId }),
    onSuccess: () => {
      message.success('Permission removed successfully');
      refetchRolePermissions();
    },
    onError: (error: Error) => {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || 'Failed to remove permission');
    },
  });

  // Actions
  const createRole = async (roleData: CreateRoleParamsDto): Promise<void> => {
    await createRoleMutation.mutateAsync(roleData);
  };

  const updateRole = async (id: string, roleData: UpdateRoleParamsDto): Promise<void> => {
    await updateRoleMutation.mutateAsync({ id, roleData });
  };

  const deleteRole = async (roleId: string): Promise<void> => {
    await deleteRoleMutation.mutateAsync(roleId);
  };

  const assignPermission = async (roleId: string, permissionId: string): Promise<void> => {
    await assignPermissionMutation.mutateAsync({ roleId, permissionId });
  };

  const removePermission = async (roleId: string, permissionId: string): Promise<void> => {
    await removePermissionMutation.mutateAsync({ roleId, permissionId });
  };

  const selectRole = (role: Role | null): void => {
    setSelectedRole(role);
  };

  return {
    // Data
    roles,
    permissions,
    rolePermissions,
    roleUsers,
    selectedRole,

    // Loading states
    rolesLoading,
    isCreating: createRoleMutation.isPending,
    isUpdating: updateRoleMutation.isPending,
    isDeleting: deleteRoleMutation.isPending,
    isAssigningPermission: assignPermissionMutation.isPending,
    isRemovingPermission: removePermissionMutation.isPending,

    // Actions
    createRole,
    updateRole,
    deleteRole,
    assignPermission,
    removePermission,
    selectRole,
    refetchRoles,
  };
};
