import { accessTokenPayloadSchema, type AccessTokenPayloadResult } from '@repo/entix-sdk';
import { appConfig } from '@config/app.config';

/**
 * Decodes a JWT token without verification (client-side)
 * Note: This is safe for extracting user data since we trust our own tokens
 * and the backend still validates them for security-critical operations
 */
export const decodeJwtToken = <T = Record<string, unknown>>(token: string): T | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const decoded = atob(payload);
    return JSON.parse(decoded) as T;
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
};

/**
 * Gets the access token from localStorage
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(appConfig.VITE_ACCESS_TOKEN_KEY);
};

/**
 * Gets the refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(appConfig.VITE_REFRESH_TOKEN_KEY);
};

/**
 * Decodes and validates the access token payload
 */
export const getAccessTokenPayload = (): AccessTokenPayloadResult | null => {
  const token = getAccessToken();
  if (!token) return null;

  const decoded = decodeJwtToken(token);
  if (!decoded) return null;

  try {
    return accessTokenPayloadSchema.parse(decoded);
  } catch (error) {
    console.error('Invalid access token payload:', error);
    return null;
  }
};

/**
 * Checks if the current access token is expired
 */
export const isTokenExpired = (token?: string): boolean => {
  const targetToken = token || getAccessToken();
  if (!targetToken) return true;

  const payload = decodeJwtToken<{ exp?: number }>(targetToken);
  if (!payload?.exp) return true;

  // Add 30 second buffer to avoid edge cases
  const bufferTime = 30;
  return Date.now() >= payload.exp * 1000 - bufferTime * 1000;
};

/**
 * Gets user permissions from the access token
 */
export const getUserPermissions = (): number[] => {
  const payload = getAccessTokenPayload();
  return payload?.permissionCodes || [];
};

/**
 * Gets current user data from the access token
 */
export const getCurrentUserFromToken = () => {
  const payload = getAccessTokenPayload();
  if (!payload) return null;

  return {
    id: payload.sub,
    username: payload.username,
    email: payload.email,
    permissionCodes: payload.permissionCodes,
  };
};

/**
 * Utility to check if user has a specific permission
 */
export const hasPermission = (permissionCode: number): boolean => {
  const permissions = getUserPermissions();
  return permissions.includes(permissionCode);
};

/**
 * Utility to check if user has any of the specified permissions
 */
export const hasAnyPermission = (permissionCodes: number[]): boolean => {
  const permissions = getUserPermissions();
  return permissionCodes.some(code => permissions.includes(code));
};

/**
 * Utility to check if user has all of the specified permissions
 */
export const hasAllPermissions = (permissionCodes: number[]): boolean => {
  const permissions = getUserPermissions();
  return permissionCodes.every(code => permissions.includes(code));
};
