import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { App } from 'antd';
import type { LoginDto, LoginResultDto, VerifySessionResultDto } from '@repo/entix-sdk';
import { apiClient } from '@lib/api-client';
import { appConfig } from '@config/app.config';
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
      return apiClient.auth.login(loginCredentials);
    },
    onSuccess: (loginResult: LoginResultDto) => {
      // Store tokens
      localStorage.setItem(appConfig.VITE_ACCESS_TOKEN_KEY, loginResult.accessToken);
      localStorage.setItem(appConfig.VITE_REFRESH_TOKEN_KEY, loginResult.refreshToken);

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
      const refreshToken = localStorage.getItem(appConfig.VITE_REFRESH_TOKEN_KEY);
      if (refreshToken) {
        const logoutRequest: { refreshToken: string } = { refreshToken };
        return apiClient.auth.logout(logoutRequest);
      }
      return Promise.resolve();
    },
    onSuccess: () => {
      // Clear tokens
      localStorage.removeItem(appConfig.VITE_ACCESS_TOKEN_KEY);
      localStorage.removeItem(appConfig.VITE_REFRESH_TOKEN_KEY);

      // Clear auth state
      setIsAuthenticated(false);
      setCurrentUser(null);
      setUserPermissions([]);

      message.success('Logout successful');
      navigate('/auth/login');
    },
    onError: () => {
      // Clear tokens even on error
      localStorage.removeItem(appConfig.VITE_ACCESS_TOKEN_KEY);
      localStorage.removeItem(appConfig.VITE_REFRESH_TOKEN_KEY);

      // Clear auth state
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
        const result = (await apiClient.auth.verifySession()) as VerifySessionResultDto;
        return result;
      } catch (verificationError) {
        // Clear auth state on verification failure
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserPermissions([]);

        // Clear tokens
        localStorage.removeItem(appConfig.VITE_ACCESS_TOKEN_KEY);
        localStorage.removeItem(appConfig.VITE_REFRESH_TOKEN_KEY);

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
