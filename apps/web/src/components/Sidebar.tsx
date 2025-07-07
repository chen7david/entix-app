import { useState, useEffect } from 'react';
import { Layout, Menu, Button, Switch, Typography, Divider } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  SafetyOutlined,
  KeyOutlined,
  MoonOutlined,
  SunOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissions, useLogout } from '@/hooks/auth.hook';
import { useTheme } from '@/providers/ThemeProvider';
import { PermissionCode } from '@repo/entix-sdk';

const { Sider } = Layout;
const { Text } = Typography;

type SidebarProps = {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
};

/**
 * Responsive Sidebar component with permission-based navigation
 */
export const Sidebar = ({ collapsed, onCollapse }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const { toggleTheme, themeMode } = useTheme();
  const logout = useLogout();
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile && !collapsed) {
      onCollapse(true);
    }
  }, [isMobile, collapsed, onCollapse]);

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
            icon: <UsergroupAddOutlined />,
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
            icon: <SafetyOutlined />,
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

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      trigger={null}
      width={256}
      collapsedWidth={isMobile ? 0 : 80}
      style={{
        position: isMobile ? 'fixed' : 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 1000,
        boxShadow: isMobile ? '2px 0 8px rgba(0,0,0,0.1)' : 'none',
      }}
      breakpoint="lg"
      onBreakpoint={broken => {
        setIsMobile(broken);
      }}
    >
      {/* Header with toggle button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid var(--ant-color-border)',
        }}
      >
        {!collapsed && (
          <Text strong style={{ fontSize: '18px' }}>
            Entix
          </Text>
        )}
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => onCollapse(!collapsed)}
          style={{ display: isMobile ? 'block' : 'none' }}
        />
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
        }}
      />

      {/* Theme Toggle and Logout at bottom */}
      <div style={{ borderTop: '1px solid var(--ant-color-border)' }}>
        {/* Theme Toggle */}
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {!collapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SunOutlined />
                <Text style={{ fontSize: '14px' }}>Theme</Text>
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
        </div>

        <Divider style={{ margin: 0 }} />

        {/* Logout */}
        <div style={{ padding: '16px' }}>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={() => logout.mutate()}
            loading={logout.isPending}
            style={{ width: '100%', justifyContent: 'flex-start' }}
            danger
          >
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobile && !collapsed && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: -1,
          }}
          onClick={() => onCollapse(true)}
        />
      )}
    </Sider>
  );
};
