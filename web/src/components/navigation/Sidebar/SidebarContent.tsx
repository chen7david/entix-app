import React from 'react';
import { Avatar, Button, Typography, Skeleton, Dropdown, type MenuProps } from 'antd';
import { UserOutlined, MoreOutlined, SettingOutlined, LogoutOutlined, SafetyOutlined } from '@ant-design/icons';
import { SidebarMenu } from './SidebarMenu';
import { SidebarOrgSwitcher } from './SidebarOrgSwitcher';
import { useAuth, useSignOut } from '@web/src/hooks/auth/useAuth';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';
import { useNavigate } from 'react-router';
import { links } from '@web/src/constants/links';

const { Text } = Typography;

export const SidebarContent: React.FC = () => {
    const { session, isLoading } = useAuth();
    const { mutate: signOut } = useSignOut();
    const { activeOrganization } = useOrganization();
    const navigate = useNavigate();
    const slug = activeOrganization?.slug || '';

    const handleMenuClick: MenuProps['onClick'] = (e) => {
        if (e.key === 'logout') {
            signOut(undefined, {
                onSuccess: () => {
                    navigate(links.auth.signIn);
                }
            });
        } else {
            navigate(e.key);
        }
    };

    const userMenuItems: MenuProps['items'] = [
        ...(slug ? [
            {
                key: links.dashboard.profile(slug),
                label: 'Profile',
                icon: <UserOutlined />,
            },
            {
                key: links.dashboard.sessions(slug),
                label: 'Sessions',
                icon: <SafetyOutlined />,
            },
            {
                key: links.dashboard.settings(slug),
                label: 'Settings',
                icon: <SettingOutlined />,
            },
            {
                type: 'divider' as const,
            },
        ] : []),
        {
            key: 'logout',
            label: 'Sign Out',
            icon: <LogoutOutlined />,
            danger: true,
        },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* User Profile (Top) */}
            <div className="p-4">
                {isLoading ? (
                    <Skeleton active avatar paragraph={{ rows: 1 }} />
                ) : (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar
                            size={40}
                            src={session.data?.user?.image}
                            icon={<UserOutlined />}
                            className="flex-shrink-0 border border-gray-200"
                        />
                        <div className="flex flex-col min-w-0">
                            <Text strong className="truncate text-sm text-gray-900">
                                {session.data?.user?.name}
                            </Text>
                            <Text type="secondary" className="truncate text-xs">
                                {session.data?.user?.email}
                            </Text>
                        </div>
                    </div>
                )}
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto py-2">
                <SidebarMenu />
            </div>

            {/* Footer: Org Switcher & User Menu */}
            <div className="border-t border-gray-100">
                <div className="flex items-center gap-1 p-2">
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <SidebarOrgSwitcher />
                    </div>
                    <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} trigger={['click']} placement="topRight">
                        <Button type="text" icon={<MoreOutlined />} className="text-gray-500 hover:text-gray-700 flex-shrink-0" />
                    </Dropdown>
                </div>
            </div>
        </div>
    );
};

