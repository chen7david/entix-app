import { atom } from 'jotai';
import { getCurrentUserFromToken } from '@lib/jwt.utils';

/**
 * Authentication state atoms using Jotai
 */

// Check if user is authenticated based on token presence
const getInitialAuthState = () => {
  const user = getCurrentUserFromToken();
  return !!user;
};

// Get initial user state from token
const getInitialUserState = () => {
  return getCurrentUserFromToken();
};

// Get initial permissions state from token
const getInitialPermissionsState = () => {
  const user = getCurrentUserFromToken();
  return user?.permissionCodes || [];
};

// Authentication state atoms
export const isAuthenticatedAtom = atom<boolean>(getInitialAuthState());
export const currentUserAtom = atom<ReturnType<typeof getCurrentUserFromToken>>(getInitialUserState());
export const userPermissionsAtom = atom<number[]>(getInitialPermissionsState());
export const authLoadingAtom = atom<boolean>(false);
