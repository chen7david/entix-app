import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { userService } from '@/features/users/services';
import { usePermissions } from '@/features/auth/hooks/useAuth';
import { PermissionCode } from '@repo/entix-sdk';
import type { User, CreateUserParamsDto, UpdateUserParamsDto } from '@repo/entix-sdk';

/**
 * Custom hook for users management business logic
 */
export const useUsers = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Queries
  const {
    data: users = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    enabled: hasPermission(PermissionCode.GET_USERS),
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ['user-roles', selectedUser?.id],
    queryFn: () => (selectedUser ? userService.getUserRoles(selectedUser.id) : Promise.resolve([])),
    enabled: !!selectedUser && hasPermission(PermissionCode.GET_USER_ROLES),
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserParamsDto) => userService.createUser(userData),
    onSuccess: () => {
      message.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalVisible(false);
    },
    onError: () => {
      message.error('Failed to create user');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: UpdateUserParamsDto }) =>
      userService.updateUser(id, userData),
    onSuccess: () => {
      message.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditModalVisible(false);
      setSelectedUser(null);
    },
    onError: () => {
      message.error('Failed to update user');
    },
  });

  // Filter users based on search and status
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch =
      !searchTerm ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && !user.disabledAt) ||
      (selectedStatus === 'inactive' && user.disabledAt);

    return matchesSearch && matchesStatus;
  });

  // Actions
  const handleCreateUser = async (values: CreateUserParamsDto) => {
    try {
      await createUserMutation.mutateAsync(values);
    } catch (error) {
      console.error('Create user error:', error);
    }
  };

  const handleUpdateUser = async (values: UpdateUserParamsDto) => {
    if (!selectedUser) return;

    try {
      await updateUserMutation.mutateAsync({
        id: selectedUser.id,
        userData: values,
      });
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalVisible(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsDetailDrawerVisible(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalVisible(false);
  };

  const closeEditModal = () => {
    setIsEditModalVisible(false);
    setSelectedUser(null);
  };

  const closeDetailDrawer = () => {
    setIsDetailDrawerVisible(false);
    setSelectedUser(null);
  };

  return {
    // State
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    isCreateModalVisible,
    isEditModalVisible,
    isDetailDrawerVisible,
    selectedUser,

    // Data
    users: filteredUsers,
    allUsers: users,
    userRoles,
    usersLoading,

    // Mutations
    createUserMutation,
    updateUserMutation,

    // Actions
    handleCreateUser,
    handleUpdateUser,
    handleEditUser,
    handleViewUser,
    closeCreateModal,
    closeEditModal,
    closeDetailDrawer,
    refetchUsers,

    // Modal controls
    openCreateModal: () => setIsCreateModalVisible(true),
  };
};

/**
 * Hook for fetching user roles
 */
export const useUserRoles = (userId: string | undefined) => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => (userId ? userService.getUserRoles(userId) : Promise.resolve([])),
    enabled: !!userId && hasPermission(PermissionCode.GET_USER_ROLES),
  });
};
