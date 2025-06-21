import { EntixApiClient } from '@repo/entix-sdk';
import { atom } from 'jotai';

// Constants
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const AUTH_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Get the stored auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Get the stored refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Store auth tokens in localStorage
 */
export const storeTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Clear auth tokens from localStorage
 */
export const clearTokens = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Create API client instance
 */
export const apiClient = new EntixApiClient({
  baseURL: API_URL,
  getToken: getAuthToken,
  refreshToken: async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // For token refresh, we need to make a direct API call
      // This is a simplified example - adjust based on your actual API
      const response = await fetch(`${API_URL}/v1/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      return data.accessToken;
    } catch (error) {
      clearTokens();
      window.location.href = '/auth/login';
      throw error;
    }
  },
  onTokenRefreshed: (token: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },
  onAuthError: () => {
    clearTokens();
    window.location.href = '/auth/login';
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
