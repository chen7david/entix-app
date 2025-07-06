import { apiClient } from '@lib/api-client';
import type { User, CreateUserParamsDto, UpdateUserParamsDto } from '@repo/entix-sdk';

/**
 * Users service for handling all user-related operations
 * Provides centralized business logic, error handling, and data transformations
 */
export class UserService {
  /**
   * Get all users
   */
  async getUsers(): Promise<User[]> {
    try {
      return await apiClient.users.getUsers();
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw new Error('Failed to load users. Please try again.');
    }
  }

  /**
   * Get user by ID
   */
  async getUser(id: string): Promise<User> {
    try {
      return await apiClient.users.getUser(id);
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      throw new Error('Failed to load user details. Please try again.');
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserParamsDto): Promise<User> {
    try {
      return await apiClient.users.createUser(userData);
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error('Failed to create user. Please check your input and try again.');
    }
  }

  /**
   * Update existing user
   */
  async updateUser(id: string, userData: UpdateUserParamsDto): Promise<User> {
    try {
      return await apiClient.users.updateUser(id, userData);
    } catch (error) {
      console.error(`Failed to update user ${id}:`, error);
      throw new Error('Failed to update user. Please check your input and try again.');
    }
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string) {
    try {
      return await apiClient.users.getUserRoles(userId);
    } catch (error) {
      console.error(`Failed to fetch roles for user ${userId}:`, error);
      throw new Error('Failed to load user roles. Please try again.');
    }
  }
}

// Export singleton instance
export const userService = new UserService();
