import { EntixApiClient } from '@repo/entix-sdk';
import { atom } from 'jotai';
import { appConfig } from '@config/app.config';
import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  getCurrentUserFromToken,
  getUserPermissions,
  isTokenExpired,
} from './jwt.utils';

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
 * Only refreshes tokens when we get a 401/expired error, not for permission checks
 */
export const apiClient = new EntixApiClient({
  baseURL: appConfig.VITE_API_URL,
  getAuthToken: getAccessToken,
  refreshAuthToken: async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${appConfig.VITE_API_URL}/api/v1/auth/refresh-token`, {
        refreshToken,
      });

      // Store the new access token
      const newAccessToken = response.data.accessToken;
      const newRefreshToken = response.data.refreshToken;
      storeTokens(newAccessToken, newRefreshToken);

      return newAccessToken;
    } catch {
      // If refresh fails, clear tokens
      clearTokens();
      throw new Error('Failed to refresh token');
    }
  },
  onTokenRefreshed: (token: string) => {
    // Token is already stored in refreshAuthToken, but update it here too for safety
    localStorage.setItem(appConfig.VITE_ACCESS_TOKEN_KEY, token);
  },
  onAuthenticationError: () => {
    // Clear tokens and force re-authentication
    clearTokens();
    window.location.href = '/auth/login';
  },
});

// Authentication state atom - derived from token presence and validity
export const isAuthenticatedAtom = atom<boolean>(() => {
  const token = getAccessToken();
  return !!token && !isTokenExpired(token);
});

// Current user atom - derived from JWT token (static until re-authentication)
export const currentUserAtom = atom(() => {
  return getCurrentUserFromToken();
});

// Permissions atom - derived from JWT token (static until re-authentication)
export const userPermissionsAtom = atom<number[]>(() => {
  return getUserPermissions();
});

// Backward compatibility exports
export { getAccessToken as getAuthToken, getRefreshToken };
