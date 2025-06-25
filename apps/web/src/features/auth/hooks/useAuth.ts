import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { App } from 'antd';
import type {
  LoginDto,
  SignUpDto,
  ConfirmSignUpDto,
  ForgotPasswordDto,
  ConfirmForgotPasswordDto,
  ResendConfirmationCodeDto,
} from '@repo/entix-sdk';
import { authService } from '@/features/auth/services';
import { AxiosError } from 'axios';
import {
  getAccessToken,
  isTokenExpired,
  hasPermission as hasPermissionUtil,
  hasAnyPermission as hasAnyPermissionUtil,
  hasAllPermissions as hasAllPermissionsUtil,
  getCurrentUserFromToken,
} from '@lib/jwt.utils';
import { isAuthenticatedAtom, currentUserAtom, userPermissionsAtom, authLoadingAtom } from '../store/auth.store';
import type { UseAuthReturn, UsePermissionsReturn } from '../types/auth.types';

/**
 * Hook for handling user login
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [, setCurrentUser] = useAtom(currentUserAtom);
  const [, setUserPermissions] = useAtom(userPermissionsAtom);
  const [, setAuthLoading] = useAtom(authLoadingAtom);

  return useMutation({
    mutationFn: async (loginCredentials: LoginDto) => {
      return authService.login(loginCredentials);
    },
    onSuccess: () => {
      // Update auth state
      setIsAuthenticated(true);
      setCurrentUser(getCurrentUserFromToken());
      setUserPermissions(getCurrentUserFromToken()?.permissionCodes || []);
      setAuthLoading(false);

      message.success('Login successful');
      navigate('/auth/profile');
    },
    onError: (loginError: unknown) => {
      setAuthLoading(false);
      if (loginError instanceof AxiosError) {
        message.error(loginError.response?.data.message || 'Login failed');
      } else if (loginError instanceof Error) {
        message.error(loginError.message);
      } else {
        message.error('Login failed');
      }
    },
  });
};

/**
 * Hook for handling user signup
 */
export const useSignUp = () => {
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (signUpData: SignUpDto) => {
      return authService.signUp(signUpData);
    },
    onSuccess: () => {
      message.success('Account created successfully. Please check your email for confirmation code.');
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data.message || 'Sign up failed');
      } else if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Sign up failed');
      }
    },
  });
};

/**
 * Hook for confirming user signup
 */
export const useConfirmSignUp = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (confirmData: ConfirmSignUpDto) => {
      return authService.confirmSignUp(confirmData);
    },
    onSuccess: () => {
      message.success('Account confirmed successfully! You can now login.');
      navigate('/auth/login');
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data.message || 'Confirmation failed');
      } else if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Confirmation failed');
      }
    },
  });
};

/**
 * Hook for resending confirmation code
 */
export const useResendConfirmationCode = () => {
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (resendData: ResendConfirmationCodeDto) => {
      return authService.resendConfirmationCode(resendData);
    },
    onSuccess: () => {
      message.success('Confirmation code sent successfully!');
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data.message || 'Failed to resend code');
      } else if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Failed to resend code');
      }
    },
  });
};

/**
 * Hook for handling forgot password
 */
export const useForgotPassword = () => {
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (forgotPasswordData: ForgotPasswordDto) => {
      return authService.forgotPassword(forgotPasswordData);
    },
    onSuccess: () => {
      message.success('Password reset code sent to your email!');
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data.message || 'Failed to send reset code');
      } else if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Failed to send reset code');
      }
    },
  });
};

/**
 * Hook for confirming password reset
 */
export const useConfirmForgotPassword = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (confirmData: ConfirmForgotPasswordDto) => {
      return authService.confirmForgotPassword(confirmData);
    },
    onSuccess: () => {
      message.success('Password reset successfully! You can now login with your new password.');
      navigate('/auth/login');
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data.message || 'Password reset failed');
      } else if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Password reset failed');
      }
    },
  });
};

/**
 * Hook for handling user logout
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [, setCurrentUser] = useAtom(currentUserAtom);
  const [, setUserPermissions] = useAtom(userPermissionsAtom);

  return useMutation({
    mutationFn: async () => {
      return authService.logout();
    },
    onSuccess: () => {
      // Clear auth state
      setIsAuthenticated(false);
      setCurrentUser(null);
      setUserPermissions([]);

      message.success('Logout successful');
      navigate('/auth/login');
    },
    onError: () => {
      // Clear auth state even on error
      setIsAuthenticated(false);
      setCurrentUser(null);
      setUserPermissions([]);

      navigate('/auth/login');
    },
  });
};

/**
 * Hook for session validation
 */
export const useVerifySession = () => {
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [, setCurrentUser] = useAtom(currentUserAtom);
  const [, setUserPermissions] = useAtom(userPermissionsAtom);

  return useQuery({
    queryKey: ['verify-session'],
    queryFn: async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token found');
      }

      try {
        const result = await authService.verifySession();
        return result;
      } catch (verificationError) {
        // Clear auth state on verification failure
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserPermissions([]);

        // Force redirect to login
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 100);
        throw verificationError;
      }
    },
    enabled: !!getAccessToken(),
    retry: false,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to check authentication status
 */
export const useAuth = (): UseAuthReturn => {
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const [permissions] = useAtom(userPermissionsAtom);

  return {
    isAuthenticated,
    user: currentUser,
    permissions,
    isTokenExpired: () => {
      const token = getAccessToken();
      return !token || isTokenExpired(token);
    },
  };
};

/**
 * Hook to check if the current user has specific permissions
 */
export const usePermissions = (): UsePermissionsReturn => {
  const [permissions] = useAtom(userPermissionsAtom);

  return {
    permissions,
    hasPermission: hasPermissionUtil,
    hasAnyPermission: hasAnyPermissionUtil,
    hasAllPermissions: hasAllPermissionsUtil,
  };
};
