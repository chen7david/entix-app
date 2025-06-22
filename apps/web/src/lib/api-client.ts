import { EntixApiClient } from '@repo/entix-sdk';
import { atom } from 'jotai';
import { appConfig } from '../config/app.config';
import axios from 'axios';

/**
 * Get the stored auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(appConfig.VITE_ACCESS_TOKEN_KEY);
};

/**
 * Get the stored refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(appConfig.VITE_REFRESH_TOKEN_KEY);
};

/**
 * Store auth tokens in localStorage
 */
export const storeTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(appConfig.VITE_ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(appConfig.VITE_REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Clear auth tokens from localStorage
 */
export const clearTokens = (): void => {
  localStorage.removeItem(appConfig.VITE_ACCESS_TOKEN_KEY);
  localStorage.removeItem(appConfig.VITE_REFRESH_TOKEN_KEY);
};

/**
 * Create API client instance
 */
export const apiClient = new EntixApiClient({
  baseURL: appConfig.VITE_API_URL,
  getToken: getAuthToken,
  refreshToken: async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${appConfig.VITE_API_URL}/v1/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Check for specific error codes
        if (errorData.code === 'INVALID_REFRESH_TOKEN') {
          clearTokens();
          window.location.href = '/auth/login';
          throw new Error('Invalid refresh token');
        }

        throw new Error(errorData.message || 'Failed to refresh token');
      }

      const data = await response.json();

      // If the response includes a new refresh token, store both tokens
      if (data.refreshToken) {
        storeTokens(data.accessToken, data.refreshToken);
      }

      return data.accessToken;
    } catch (error) {
      // Only clear tokens for auth-related errors
      if (
        error instanceof Error &&
        (error.message.includes('refresh token') || error.message.includes('token') || error.message.includes('auth'))
      ) {
        clearTokens();
      }
      throw error;
    }
  },
  onTokenRefreshed: (token: string) => {
    localStorage.setItem(appConfig.VITE_ACCESS_TOKEN_KEY, token);
  },
  onAuthError: error => {
    // Check if it's an axios error with response data
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data;

      // Only redirect to login for specific error codes
      if (
        errorData.code === 'INVALID_CREDENTIALS' ||
        errorData.code === 'UNAUTHORIZED' ||
        errorData.code === 'INVALID_ACCESS_TOKEN'
      ) {
        clearTokens();
        window.location.href = '/auth/login';
      }
    } else {
      // For non-specific errors, clear tokens but don't redirect
      clearTokens();
    }
  },
});

// Authentication state atom
export const isAuthenticatedAtom = atom<boolean>(!!getAuthToken());

// Current user atom
export const currentUserAtom = atom<{
  id: string;
  username: string;
  email: string;
} | null>(null);
