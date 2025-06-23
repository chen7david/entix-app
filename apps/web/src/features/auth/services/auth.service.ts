import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '@lib/api-client';
import type {
  LoginDto,
  SignUpDto,
  ConfirmSignUpDto,
  ForgotPasswordDto,
  ConfirmForgotPasswordDto,
  LoginResultDto,
  SignUpResultDto,
} from '@shared/types';

/**
 * Authentication Service
 * Handles all auth-related API calls and state management
 */
class AuthService {
  /**
   * Get the auth API instance
   */
  private get authApi() {
    if (!apiClient?.auth) {
      throw new Error('Auth API not available - client not initialized properly');
    }
    return apiClient.auth;
  }

  /**
   * Login user
   */
  async login(credentials: LoginDto): Promise<LoginResultDto> {
    return await this.authApi.login(credentials);
  }

  /**
   * Register new user
   */
  async signUp(userData: SignUpDto): Promise<SignUpResultDto> {
    return await this.authApi.signUp(userData);
  }

  /**
   * Confirm user registration
   */
  async confirmSignUp(confirmData: ConfirmSignUpDto) {
    return await this.authApi.confirmSignUp(confirmData);
  }

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordDto) {
    return await this.authApi.forgotPassword(data);
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: ConfirmForgotPasswordDto) {
    return await this.authApi.confirmForgotPassword(data);
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string) {
    return await this.authApi.logout({ refreshToken });
  }
}

// Export singleton instance
export const authService = new AuthService();

/**
 * Auth Hooks
 * React Query hooks for authentication
 */

export const useLoginMutation = (options?: UseMutationOptions<LoginResultDto, Error, LoginDto>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
    ...options,
  });
};

export const useSignUpMutation = () => {
  return useMutation({
    mutationFn: authService.signUp,
  });
};

export const useConfirmSignUpMutation = () => {
  return useMutation({
    mutationFn: authService.confirmSignUp,
  });
};

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: authService.forgotPassword,
  });
};

export const useConfirmPasswordResetMutation = () => {
  return useMutation({
    mutationFn: authService.confirmPasswordReset,
  });
};
