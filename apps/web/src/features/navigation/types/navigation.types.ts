import type { ReactNode } from 'react';

/**
 * Navigation menu item interface
 */
export type NavigationMenuItem = {
  key: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  permission?: number;
};

/**
 * Sidebar props interface
 */
export type SidebarProps = {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
};

/**
 * Protected route props interface
 */
export type ProtectedRouteProps = {
  children: ReactNode;
  permission?: number;
  anyPermissions?: number[];
  allPermissions?: number[];
  redirectTo?: string;
};

/**
 * Public route props interface
 */
export type PublicRouteProps = {
  children: ReactNode;
  redirectTo?: string;
};

/**
 * Permission guard props interface
 */
export type PermissionGuardProps = {
  permission?: number;
  anyPermissions?: number[];
  allPermissions?: number[];
  children: ReactNode;
  fallback?: ReactNode;
};
