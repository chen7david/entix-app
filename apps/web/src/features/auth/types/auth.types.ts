import type { LoginDto, LoginResultDto, VerifySessionResultDto } from '@repo/entix-sdk';

/**
 * User type from token payload (subset of User model)
 */
export type TokenUser = {
  id: string;
  username: string;
  email: string;
  permissionCodes: number[];
};

/**
 * Authentication state interface
 */
export type AuthState = {
  isAuthenticated: boolean;
  user: TokenUser | null;
  permissions: number[];
  isLoading: boolean;
};

/**
 * Login form data interface
 */
export type LoginFormData = LoginDto;

/**
 * Authentication context interface
 */
export type AuthContextType = {
  isAuthenticated: boolean;
  user: TokenUser | null;
  permissions: number[];
  login: (credentials: LoginDto) => Promise<LoginResultDto>;
  logout: () => Promise<void>;
  verifySession: () => Promise<VerifySessionResultDto>;
  hasPermission: (permissionCode: number) => boolean;
  hasAnyPermission: (permissionCodes: number[]) => boolean;
  hasAllPermissions: (permissionCodes: number[]) => boolean;
};

/**
 * Authentication hook return type
 */
export type UseAuthReturn = {
  isAuthenticated: boolean;
  user: TokenUser | null;
  permissions: number[];
  isTokenExpired: () => boolean;
};

/**
 * Permissions hook return type
 */
export type UsePermissionsReturn = {
  permissions: number[];
  hasPermission: (permissionCode: number) => boolean;
  hasAnyPermission: (permissionCodes: number[]) => boolean;
  hasAllPermissions: (permissionCodes: number[]) => boolean;
};
