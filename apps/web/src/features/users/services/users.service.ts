import type { User, CreateUserParamsDto, UpdateUserParamsDto } from '@repo/entix-sdk';
import { apiClient } from '@lib/api-client';

/**
 * Users service for API operations
 */
export class UsersService {
  /**
   * Get all users
   */
  async getUsers(): Promise<User[]> {
    return apiClient.users.getUsers();
  }

  /**
   * Get user by ID
   */
  async getUser(id: string): Promise<User> {
    return apiClient.users.getUser(id);
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserParamsDto): Promise<User> {
    return apiClient.users.createUser(userData);
  }

  /**
   * Update user
   */
  async updateUser(id: string, userData: UpdateUserParamsDto): Promise<User> {
    return apiClient.users.updateUser(id, userData);
  }
}

/**
 * Singleton instance of users service
 */
export const usersService = new UsersService();
