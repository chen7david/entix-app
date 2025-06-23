import { EntixApiClient } from '@repo/entix-sdk';
import { atom } from 'jotai';
import { appConfig } from '@config/app.config';
import {
  getAccessToken,
  getRefreshToken,
  getCurrentUserFromToken,
  getUserPermissions,
  isTokenExpired,
} from './jwt.utils';

// Store atom setters to trigger updates
let atomSetters: {
  setIsAuthenticated?: (value: boolean) => void;
  setCurrentUser?: (value: ReturnType<typeof getCurrentUserFromToken>) => void;
  setUserPermissions?: (value: number[]) => void;
} = {};

/**
 * Register atom setters for manual updates
 */
export const registerAtomSetters = (setters: typeof atomSetters) => {
  atomSetters = setters;
};

/**
 * Update all authentication atoms when auth state changes
 */
export const updateAuthState = () => {
  if (typeof window !== 'undefined') {
    const token = getAccessToken();
    const isAuth = !!token && !isTokenExpired(token);
    const user = getCurrentUserFromToken();
    const permissions = getUserPermissions();

    atomSetters.setIsAuthenticated?.(isAuth);
    atomSetters.setCurrentUser?.(user);
    atomSetters.setUserPermissions?.(permissions);
  }
};

/**
 * Store auth tokens and update atoms
 */
export const storeTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(appConfig.VITE_ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(appConfig.VITE_REFRESH_TOKEN_KEY, refreshToken);
  updateAuthState();
};

/**
 * Clear auth tokens and update atoms
 */
export const clearTokens = (): void => {
  localStorage.removeItem(appConfig.VITE_ACCESS_TOKEN_KEY);
  localStorage.removeItem(appConfig.VITE_REFRESH_TOKEN_KEY);
  updateAuthState();
};

/**
 * Create API client instance
 * Only refreshes tokens when we get a 401/expired error, not for permission checks
 */
let apiClient: EntixApiClient;

try {
  apiClient = new EntixApiClient({
    baseURL: appConfig.VITE_API_URL,
    getAuthToken: getAccessToken,
    refreshAuthToken: async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        throw new Error('No refresh token available');
      }

      try {
        // Use the SDK's auth API instead of direct axios call to avoid double /api path
        const refreshResponse = await fetch(`${appConfig.VITE_API_URL}/v1/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken,
          }),
        });

        if (!refreshResponse.ok) {
          throw new Error('Failed to refresh token');
        }

        const response = await refreshResponse.json();

        // Store the new access token
        const newAccessToken = response.accessToken;
        const newRefreshToken = response.refreshToken;
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
} catch (error) {
  console.error('❌ API Client: Failed to initialize:', error);
  throw error;
}

export { apiClient };

// Get initial values from localStorage safely
const getInitialAuthState = () => {
  if (typeof window === 'undefined') return false;
  const token = getAccessToken();
  return !!token && !isTokenExpired(token);
};

const getInitialUser = () => {
  if (typeof window === 'undefined') return null;
  return getCurrentUserFromToken();
};

const getInitialPermissions = () => {
  if (typeof window === 'undefined') return [];
  return getUserPermissions();
};

// Simple writable atoms that can be updated manually
export const isAuthenticatedAtom = atom<boolean>(getInitialAuthState());
export const currentUserAtom = atom<ReturnType<typeof getCurrentUserFromToken>>(getInitialUser());
export const userPermissionsAtom = atom<number[]>(getInitialPermissions());

// Backward compatibility exports
export { getAccessToken as getAuthToken, getRefreshToken };
