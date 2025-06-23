import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { message } from 'antd';
import type { LoginDto, LoginResultDto, VerifySessionResultDto } from '@repo/entix-sdk';
import {
  apiClient,
  clearTokens,
  currentUserAtom,
  isAuthenticatedAtom,
  storeTokens,
  userPermissionsAtom,
} from '@lib/api-client';
import { appConfig } from '@config/app.config';
import { AxiosError } from 'axios';
import {
  getAccessToken,
  isTokenExpired,
  hasPermission as hasPermissionUtil,
  hasAnyPermission as hasAnyPermissionUtil,
  hasAllPermissions as hasAllPermissionsUtil,
} from '@lib/jwt.utils';

/**
 * Hook for handling user login
 */
export const useLogin = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (loginCredentials: LoginDto) => {
      return apiClient.auth.login(loginCredentials);
    },
    onSuccess: (loginResult: LoginResultDto) => {
      storeTokens(loginResult.accessToken, loginResult.refreshToken);
      message.success('Login successful');
      navigate('/auth/profile');
    },
    onError: (loginError: unknown) => {
      if (loginError instanceof AxiosError) {
        message.error(loginError.response?.data.message || 'Login failed');
      }
    },
  });
};

/**
 * Hook for handling user logout
 */
export const useLogout = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem(appConfig.VITE_REFRESH_TOKEN_KEY);
      if (refreshToken) {
        const logoutRequest: { refreshToken: string } = { refreshToken };
        return apiClient.auth.logout(logoutRequest);
      }
      return Promise.resolve();
    },
    onSuccess: () => {
      clearTokens();
      message.success('Logout successful');
      navigate('/auth/login');
    },
    onError: () => {
      clearTokens();
      navigate('/auth/login');
    },
  });
};

/**
 * Hook for session validation - checks if the session is still valid on the server
 * This will automatically logout the user if the session has been invalidated
 * (e.g., after role/permission changes)
 *
 * Note: Token refresh is handled automatically by the API client interceptor
 */
export const useVerifySession = () => {
  return useQuery({
    queryKey: ['verify-session'],
    queryFn: async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token found');
      }

      try {
        const result = (await apiClient.auth.verifySession()) as VerifySessionResultDto;
        return result;
      } catch (verificationError) {
        // If session verification fails, clear tokens and force re-authentication
        clearTokens();
        // Force redirect to login
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 100);
        throw verificationError;
      }
    },
    enabled: !!getAccessToken(),
    retry: false,
    // Check session validity every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    // Check when window becomes focused
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to check authentication status
 */
export const useAuth = () => {
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
 * Permissions are static from the JWT token set at login
 */
export const usePermissions = () => {
  const [permissions] = useAtom(userPermissionsAtom);

  return {
    permissions,
    hasPermission: hasPermissionUtil,
    hasAnyPermission: hasAnyPermissionUtil,
    hasAllPermissions: hasAllPermissionsUtil,
  };
};
