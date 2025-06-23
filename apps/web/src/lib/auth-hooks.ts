import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { message } from 'antd';
import type { LoginDto, LoginResultDto } from '@repo/entix-sdk';
import { apiClient, clearTokens, currentUserAtom, isAuthenticatedAtom, storeTokens } from '@lib/api-client';
import { appConfig } from '@config/app.config';
import { AxiosError } from 'axios';

/**
 * Hook for handling user login
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [, setCurrentUser] = useAtom(currentUserAtom);

  return useMutation({
    mutationFn: async (loginCredentials: LoginDto) => {
      return apiClient.auth.login(loginCredentials);
    },
    onSuccess: (loginResult: LoginResultDto) => {
      storeTokens(loginResult.accessToken, loginResult.refreshToken);
      setIsAuthenticated(true);

      if ('user' in loginResult) {
        setCurrentUser(loginResult.user);
      }

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

/*
 * Hook for handling user logout
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [, setCurrentUser] = useAtom(currentUserAtom);

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
      setIsAuthenticated(false);
      setCurrentUser(null);
      message.success('Logout successful');
      navigate('/auth/login');
    },
    onError: () => {
      clearTokens();
      setIsAuthenticated(false);
      setCurrentUser(null);
      navigate('/auth/login');
    },
  });
};

/**
 * Hook for checking if the user session is valid
 */
export const useVerifySession = () => {
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [, setCurrentUser] = useAtom(currentUserAtom);

  return useQuery({
    queryKey: ['verify-session'],
    queryFn: async () => {
      const accessToken = localStorage.getItem(appConfig.VITE_ACCESS_TOKEN_KEY);
      if (!accessToken) {
        throw new Error('No access token found');
      }

      try {
        return await apiClient.auth.verifySession();
      } catch (verificationError) {
        clearTokens();
        setIsAuthenticated(false);
        setCurrentUser(null);
        throw verificationError;
      }
    },
    enabled: !!localStorage.getItem(appConfig.VITE_ACCESS_TOKEN_KEY),
    retry: false,
  });
};
