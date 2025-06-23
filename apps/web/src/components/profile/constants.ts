/**
 * Shared constants for Profile page components
 */

export const PROFILE_STYLES = {
  card: {
    boxShadow: 'none' as const,
    border: '1px solid var(--ant-color-border)',
  },
  cardCentered: {
    textAlign: 'center' as const,
    boxShadow: 'none' as const,
    border: '1px solid var(--ant-color-border)',
  },
  pageContainer: {
    padding: '24px',
    backgroundColor: 'var(--ant-color-bg-layout)',
    minHeight: '100vh',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  permissionFallback: {
    padding: '16px',
    border: '1px dashed var(--ant-color-border)',
    borderRadius: '6px',
    textAlign: 'center' as const,
  },
  actionButton: {
    width: '100%',
    height: '64px',
  },
} as const;

export const PROFILE_CONFIG = {
  avatar: {
    size: 80,
  },
  grid: {
    gutter: [24, 24] as [number, number],
  },
  space: {
    size: 'large' as const,
  },
} as const;

export const PERMISSION_CHECKS = [
  {
    label: 'Can view users',
    permission: 'GET_USERS' as const,
  },
  {
    label: 'Can create roles',
    permission: 'CREATE_ROLE' as const,
  },
  {
    label: 'Can manage permissions',
    permission: 'GET_PERMISSIONS' as const,
  },
  {
    label: 'Can view roles',
    permission: 'GET_ROLES' as const,
  },
] as const;

export const AVAILABLE_ACTIONS = [
  {
    title: 'View Users',
    type: 'primary' as const,
    href: '/dashboard/users',
    permission: 'GET_USERS' as const,
    fallbackText: 'Requires GET_USERS permission',
  },
  {
    title: 'Manage Roles',
    type: 'default' as const,
    href: '/dashboard/roles',
    anyPermissions: ['CREATE_ROLE', 'GET_ROLES'] as const,
    fallbackText: 'Requires ROLE permissions',
  },
  {
    title: 'Permission Management',
    type: 'dashed' as const,
    href: '/dashboard/permissions',
    allPermissions: ['GET_PERMISSIONS'] as const,
    fallbackText: 'Requires PERMISSION permissions',
  },
] as const;
