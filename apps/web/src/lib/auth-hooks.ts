import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { message } from 'antd';
import type { LoginDto, LoginResultDto, LogoutDto } from '@repo/entix-sdk';
import { apiClient, clearTokens, currentUserAtom, isAuthenticatedAtom, storeTokens } from '@lib/api-client';
import { appConfig } from '@config/app.config';
import { AxiosError } from 'axios';

type UserData = {
  id: string;
  username: string;
  email: string;
};

/**
 * Hook for handling user login
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [, setCurrentUser] = useAtom(currentUserAtom);

  return useMutation({
    mutationFn: async (credentials: LoginDto) => {
      return apiClient.auth.login(credentials);
    },
    onSuccess: (data: LoginResultDto) => {
      // Store tokens
      storeTokens(data.accessToken, data.refreshToken);

      // Update authentication state
      setIsAuthenticated(true);

      // Store user data if available
      if ('user' in data) {
        setCurrentUser(data.user as UserData);
      }

      // Show success message
      message.success('Login successful');

      // Redirect to home page
      navigate('/auth/profile');
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data.message);
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
      const refreshToken = localStorage.getItem('entix_refresh_token');
      if (refreshToken) {
        // Create a custom logout DTO that matches our updated schema
        const logoutDto: { refreshToken: string } = { refreshToken };
        return apiClient.auth.logout(logoutDto as unknown as LogoutDto);
      }
      return Promise.resolve();
    },
    onSuccess: () => {
      // Clear tokens and state
      clearTokens();
      setIsAuthenticated(false);
      setCurrentUser(null);

      // Show success message
      message.success('Logout successful');

      // Redirect to login page
      navigate('/auth/profile');
    },
    onError: () => {
      // Even if the API call fails, we still want to clear local state
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
      try {
        // This assumes you have a verifySession endpoint
        // If not available, you can use a different endpoint to validate the token
        const token = localStorage.getItem(appConfig.VITE_ACCESS_TOKEN_KEY);
        if (!token) throw new Error('No token found');

        // Simple check - in a real app, you would validate the token with your API
        return { success: true, message: 'Session valid' };
      } catch (error) {
        clearTokens();
        setIsAuthenticated(false);
        setCurrentUser(null);
        throw error;
      }
    },
    enabled: !!localStorage.getItem(appConfig.VITE_ACCESS_TOKEN_KEY),
    retry: false,
  });
};
