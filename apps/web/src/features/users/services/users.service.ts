import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@lib/api-client';
import { usePermissions } from '@shared/hooks';
import type { User, CreateUserParamsDto, UpdateUserParamsDto } from '@shared/types';
import { PermissionCode } from '@shared/types';

/**
 * Users Service
 * Handles all user-related API calls and state management
 */
class UsersService {
  /**
   * Get the users API instance
   */
  private get usersApi() {
    if (!apiClient?.users) {
      throw new Error('Users API not available - client not initialized properly');
    }
    return apiClient.users;
  }

  /**
   * Get all users
   */
  async getUsers(): Promise<User[]> {
    try {
      return await this.usersApi.getUsers();
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Get user by ID
   */
  async getUser(id: string): Promise<User> {
    try {
      return await this.usersApi.getUser(id);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw new Error('Failed to fetch user');
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserParamsDto): Promise<User> {
    try {
      return await this.usersApi.createUser(userData);
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, userData: UpdateUserParamsDto): Promise<User> {
    try {
      return await this.usersApi.updateUser(id, userData);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string) {
    try {
      return await this.usersApi.getUserRoles(userId);
    } catch (error) {
      console.error('Failed to fetch user roles:', error);
      throw new Error('Failed to fetch user roles');
    }
  }
}

// Export singleton instance
export const usersService = new UsersService();

/**
 * Users Hooks
 * React Query hooks for user management
 */

export const useUsers = () => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: ['users'],
    queryFn: usersService.getUsers,
    enabled: hasPermission(PermissionCode.GET_USERS),
  });
};

export const useUser = (id: string) => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersService.getUser(id),
    enabled: !!id && hasPermission(PermissionCode.GET_USER),
  });
};

export const useUserRoles = (userId: string) => {
  const { hasPermission } = usePermissions();

  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => (userId ? usersService.getUserRoles(userId) : Promise.resolve([])),
    enabled: !!userId && hasPermission(PermissionCode.GET_USER_ROLES),
  });
};

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...userData }: UpdateUserParamsDto & { id: string }) => usersService.updateUser(id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
