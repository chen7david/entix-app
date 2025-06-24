import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { usersService } from '../services/users.service';
import type { CreateUserParamsDto, UpdateUserParamsDto } from '@repo/entix-sdk';
import type { UseUsersReturn } from '../types/users.types';

/**
 * Hook for managing users data and operations
 */
export const useUsers = (): UseUsersReturn => {
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getUsers(),
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserParamsDto) => usersService.createUser(userData),
    onSuccess: () => {
      message.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error('Failed to create user');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: UpdateUserParamsDto }) =>
      usersService.updateUser(id, userData),
    onSuccess: () => {
      message.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      message.error('Failed to update user');
    },
  });

  return {
    users,
    isLoading,
    createUser: createUserMutation.mutateAsync,
    updateUser: (id: string, userData: UpdateUserParamsDto) => updateUserMutation.mutateAsync({ id, userData }),
    deleteUser: async () => {
      // Not implemented in API
      throw new Error('Delete user not implemented');
    },
    refetchUsers,
  };
};
