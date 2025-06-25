import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/features/auth/hooks/useAuth';
import { PermissionCode } from '@repo/entix-sdk';
import { DashboardOutlined, UserOutlined, TeamOutlined, KeyOutlined } from '@ant-design/icons';

interface MobileBottomNavProps {
  isVisible?: boolean;
}

/**
 * Mobile bottom navigation component
 * Transforms sidebar menu into phone-like bottom navbar with icons only
 * Follows mobile phone traditions with 4 main navigation buttons
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ isVisible = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();

  if (!isVisible) return null;

  // Define the main navigation items (max 4 for mobile phone tradition)
  const navItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
      show: true, // Always show dashboard
    },
    {
      key: '/dashboard/users',
      icon: <UserOutlined />,
      label: 'Users',
      onClick: () => navigate('/dashboard/users'),
      show: hasPermission(PermissionCode.GET_USERS),
    },
    {
      key: '/dashboard/roles',
      icon: <TeamOutlined />,
      label: 'Roles',
      onClick: () => navigate('/dashboard/roles'),
      show: hasPermission(PermissionCode.GET_ROLES),
    },
    {
      key: '/dashboard/permissions',
      icon: <KeyOutlined />,
      label: 'Permissions',
      onClick: () => navigate('/dashboard/permissions'),
      show: hasPermission(PermissionCode.GET_PERMISSIONS),
    },
  ]
    .filter(item => item.show)
    .slice(0, 4); // Ensure max 4 items

  const currentPath = location.pathname;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[99999] bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        backgroundColor: 'var(--ant-color-bg-container)',
        borderTop: '1px solid var(--ant-color-border)',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
        paddingBottom: 'env(safe-area-inset-bottom)', // iOS safe area
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="flex justify-around items-center h-16 px-2"
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: '64px',
          padding: '0 8px',
          backgroundColor: 'var(--ant-color-bg-container)',
        }}
      >
        {navItems.map(item => {
          const isActive = currentPath === item.key;

          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className="flex flex-col items-center justify-center flex-1 h-full rounded-lg transition-all duration-200"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                height: '100%',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                color: isActive ? 'var(--ant-color-primary)' : 'var(--ant-color-text-secondary)',
                backgroundColor: isActive ? 'var(--ant-color-primary-bg)' : 'transparent',
                cursor: 'pointer',
                border: 'none',
                outline: 'none',
                margin: '0 4px',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--ant-color-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--ant-color-text-secondary)';
                }
              }}
            >
              <div
                style={{
                  fontSize: '20px',
                  marginBottom: '4px',
                }}
              >
                {item.icon}
              </div>
              <span
                className="text-xs font-medium"
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
