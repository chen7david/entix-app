import { atom } from 'jotai';
import { getAccessToken, getCurrentUserFromToken, getUserPermissions } from '@lib/jwt.utils';
import type { TokenUser } from '../types/auth.types';

/**
 * Get initial authentication state from token
 */
const getInitialAuthState = (): boolean => {
  const token = getAccessToken();
  return !!token;
};

/**
 * Get initial user state from token
 */
const getInitialUser = (): TokenUser | null => {
  return getCurrentUserFromToken();
};

/**
 * Get initial permissions from token
 */
const getInitialPermissions = (): number[] => {
  return getUserPermissions();
};

/**
 * Authentication state atom
 */
export const isAuthenticatedAtom = atom<boolean>(getInitialAuthState());

/**
 * Current user atom (from token)
 */
export const currentUserAtom = atom<TokenUser | null>(getInitialUser());

/**
 * User permissions atom
 */
export const userPermissionsAtom = atom<number[]>(getInitialPermissions());

/**
 * Authentication loading state atom
 */
export const authLoadingAtom = atom<boolean>(false);
