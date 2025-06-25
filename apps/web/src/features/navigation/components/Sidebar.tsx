import { useState, useEffect } from 'react';
import { Layout, Menu, Button, Switch, Typography, Divider, Drawer } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  KeyOutlined,
  LogoutOutlined,
  CloseOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissions, useLogout } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/providers/ThemeProvider';
import { useResponsiveLayout } from '@/shared/hooks/useResponsive';
import { PermissionCode } from '@repo/entix-sdk';
import type { SidebarProps } from '../types/navigation.types';
import { HamburgerButton } from '@/shared/components/ui/hamburger-button';

const { Sider } = Layout;
const { Text } = Typography;

/**
 * Modern responsive sidebar with professional mobile support
 */
export const Sidebar = ({ collapsed, onCollapse }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const { toggleTheme, themeMode } = useTheme();
  const logout = useLogout();
  const { isMobile, sidebarWidth, sidebarCollapsedWidth } = useResponsiveLayout();

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile && !collapsed) {
      onCollapse(true);
    }
  }, [isMobile, collapsed, onCollapse]);

  // Close mobile drawer when navigating
  useEffect(() => {
    if (mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  }, [location.pathname]);

  // Menu items based on permissions
  const menuItems = [
    {
      key: '/auth/profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/auth/profile'),
    },
    // Users management
    ...(hasPermission(PermissionCode.GET_USERS)
      ? [
          {
            key: '/dashboard/users',
            icon: <TeamOutlined />,
            label: 'Users',
            onClick: () => navigate('/dashboard/users'),
          },
        ]
      : []),
    // Roles management
    ...(hasPermission(PermissionCode.GET_ROLES)
      ? [
          {
            key: '/dashboard/roles',
            icon: <TeamOutlined />,
            label: 'Roles',
            onClick: () => navigate('/dashboard/roles'),
          },
        ]
      : []),
    // Permissions management
    ...(hasPermission(PermissionCode.GET_PERMISSIONS)
      ? [
          {
            key: '/dashboard/permissions',
            icon: <KeyOutlined />,
            label: 'Permissions',
            onClick: () => navigate('/dashboard/permissions'),
          },
        ]
      : []),
  ];

  // Get current selected key based on location
  const selectedKeys = [location.pathname];

  // Mobile hamburger button
  const MobileHamburger = () => (
    <HamburgerButton onClick={() => setMobileDrawerOpen(true)} isVisible={!mobileDrawerOpen} />
  );

  // Sidebar content component
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 16px',
          borderBottom: '1px solid var(--ant-color-border)',
          minHeight: '64px',
        }}
      >
        {!collapsed && (
          <Text
            strong
            style={{
              fontSize: '20px',
              color: 'var(--ant-color-primary)',
              fontWeight: 600,
            }}
          >
            Entix
          </Text>
        )}
        {isMobile && (
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setMobileDrawerOpen(false)}
            style={{ marginLeft: 'auto' }}
          />
        )}
      </div>

      {/* Navigation Menu */}
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        items={menuItems}
        style={{
          borderRight: 0,
          flex: 1,
          height: 'calc(100vh - 200px)',
          overflowY: 'auto',
          padding: '8px 0',
        }}
        theme={themeMode}
      />

      {/* Footer with theme toggle and logout */}
      <div
        style={{
          borderTop: '1px solid var(--ant-color-border)',
          padding: '16px',
          backgroundColor: 'var(--ant-color-bg-container)',
        }}
      >
        {/* Theme Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SunOutlined style={{ color: 'var(--ant-color-text-secondary)' }} />
              <Text style={{ fontSize: '14px', color: 'var(--ant-color-text-secondary)' }}>Theme</Text>
            </div>
          )}
          <Switch
            checked={themeMode === 'dark'}
            onChange={toggleTheme}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            size={collapsed ? 'small' : 'default'}
          />
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* Logout */}
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={() => logout.mutate()}
          loading={logout.isPending}
          style={{
            width: '100%',
            justifyContent: 'flex-start',
            height: '40px',
            color: 'var(--ant-color-error)',
          }}
          danger
        >
          {!collapsed && 'Logout'}
        </Button>
      </div>
    </>
  );

  // Desktop sidebar
  if (!isMobile) {
    return (
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={onCollapse}
        trigger={null}
        width={sidebarWidth}
        collapsedWidth={sidebarCollapsedWidth}
        style={{
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 1000,
          backgroundColor: 'var(--ant-color-bg-container)',
          borderRight: '1px solid var(--ant-color-border)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
        }}
        theme={themeMode}
      >
        <SidebarContent />
      </Sider>
    );
  }

  // Mobile layout with hamburger and drawer
  return (
    <>
      <MobileHamburger />

      <Drawer
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        width={280}
        closable={false}
        styles={{
          body: {
            padding: 0,
            backgroundColor: 'var(--ant-color-bg-container)',
          },
          wrapper: {
            backgroundColor: 'var(--ant-color-bg-container)',
          },
        }}
      >
        <SidebarContent />
      </Drawer>
    </>
  );
};
