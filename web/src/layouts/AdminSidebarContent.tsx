import React from 'react';
import { Avatar, Button, Typography, Dropdown, type MenuProps, Menu } from 'antd';
import { UserOutlined, MoreOutlined, LogoutOutlined, SafetyOutlined, TeamOutlined, SettingOutlined, DashboardOutlined } from '@ant-design/icons';
import { useAuth, useSignOut } from '@web/src/hooks/auth/useAuth';
import { useNavigate, useLocation } from 'react-router';
import { links } from '@web/src/constants/links';

const { Text } = Typography;

export const AdminSidebarContent: React.FC = () => {
    const { session } = useAuth();
    const { mutate: signOut } = useSignOut();
    const navigate = useNavigate();
    const location = useLocation();

    // 1. User Profile Dropdown
    const handleMenuClick: MenuProps['onClick'] = (e) => {
        if (e.key === 'logout') {
            signOut(undefined, {
                onSuccess: () => {
                    navigate(links.auth.signIn);
                }
            });
        }
    };

    const userMenuItems: MenuProps['items'] = [
        {
            key: 'logout',
            label: 'Sign Out',
            icon: <LogoutOutlined />,
            danger: true,
        },
    ];

    // 2. Navigation Main Menu
    const navItems: MenuProps['items'] = [
        {
            label: 'System Management',
            key: 'system-submenu',
            icon: <SettingOutlined />,
            children: [
                {
                    label: 'System Dashboard',
                    key: links.admin.index,
                    icon: <DashboardOutlined />
                },
                {
                    label: 'Global Users',
                    key: '/admin/users', // We will build this next
                    icon: <UserOutlined />
                },
                {
                    label: 'All Organizations',
                    key: '/admin/organizations', // We will build this next
                    icon: <TeamOutlined />
                },
            ]
        }
    ];

    const handleNavClick = (e: { key: string }) => {
        navigate(e.key);
    };


    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header Badge */}
            <div className="p-4 flex items-center gap-3">
                <SafetyOutlined className="text-yellow-600 text-2xl" />
                <div className="flex flex-col">
                    <Text className="text-gray-900 text-sm font-bold uppercase tracking-wider">Super Admin</Text>
                    <Text className="text-gray-500 text-xs">Entix Platform</Text>
                </div>
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto py-2">
                <Menu
                    mode="inline"
                    theme="light"
                    selectedKeys={[location.pathname]}
                    style={{ height: "100%", background: "transparent", borderRight: 0 }}
                    onClick={handleNavClick}
                    items={navItems}
                />
            </div>

            {/* Footer Profile */}
            <div>
                <div className="flex items-center gap-1 p-2">
                    <div style={{ flex: 1, minWidth: 0, paddingLeft: 8 }} className="flex items-center gap-3">
                        <Avatar
                            size={32}
                            src={session.data?.user?.image}
                            icon={<UserOutlined />}
                            className="flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                            <Text strong className="truncate text-xs text-gray-900">
                                {session.data?.user?.name}
                            </Text>
                        </div>
                    </div>
                    <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} trigger={['click']} placement="topRight">
                        <Button type="text" icon={<MoreOutlined className="text-gray-500" />} className="hover:bg-gray-200 flex-shrink-0" />
                    </Dropdown>
                </div>
            </div>
        </div>
    );
};
