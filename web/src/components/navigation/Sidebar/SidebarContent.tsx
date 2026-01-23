import React from 'react';
import { Avatar, Button, Typography, Skeleton, Dropdown, type MenuProps } from 'antd';
import { UserOutlined, MoreOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { SidebarMenu } from './SidebarMenu';
import { useAuth, useSignOut } from '@web/src/hooks/auth/auth.hook';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';
import { useNavigate } from 'react-router';
import { links } from '@web/src/constants/links';


const { Text } = Typography;

export const SidebarContent: React.FC = () => {
    const { session, isLoading } = useAuth();
    const { mutate: signOut } = useSignOut();
    const { activeOrganization } = useOrganization();
    const navigate = useNavigate();

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
        {
            key: links.dashboard.profile,
            label: 'Profile',
            icon: <UserOutlined />,
        },
        {
            key: links.dashboard.settings,
            label: 'Settings',
            icon: <SettingOutlined />,
        },
        {
            type: 'divider',
        },
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

            {/* Footer: Settings & Logo */}
            <div className="p-4 border-t border-gray-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-gray-400">Entix</span>
                        {activeOrganization && (
                            <span className="text-xs text-gray-500 font-medium truncate max-w-[150px]">
                                {activeOrganization.name}
                            </span>
                        )}
                    </div>
                    <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} trigger={['click']} placement="topRight">
                        <Button type="text" icon={<MoreOutlined />} className="text-gray-500 hover:text-gray-700" />
                    </Dropdown>
                </div>
            </div>
        </div>
    );
};
