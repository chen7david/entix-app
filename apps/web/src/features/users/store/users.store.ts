import { atom } from 'jotai';
import type { User } from '@repo/entix-sdk';

/**
 * Users list atom
 */
export const usersAtom = atom<User[]>([]);

/**
 * Users loading state atom
 */
export const usersLoadingAtom = atom<boolean>(false);

/**
 * Selected user atom
 */
export const selectedUserAtom = atom<User | null>(null);
