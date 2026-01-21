import React from 'react';
import { Avatar, Button, Typography, Skeleton, Dropdown, type MenuProps } from 'antd';
import { UserOutlined, MoreOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { SidebarMenu } from './SidebarMenu';
import { useAuth, useSignOut } from '@web/src/hooks/auth/auth.hook';
import { useNavigate } from 'react-router';
import { links } from '@web/src/constants/links';
import { OrganizationSwitcher } from '@web/src/components/organization/OrganizationSwitcher';

const { Text } = Typography;

export const SidebarContent: React.FC = () => {
    const { session, isLoading } = useAuth();
    const { mutate: signOut } = useSignOut();
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
            {/* Header / Logo */}
            <div className="p-4 flex items-center h-16 border-b border-gray-100">
                <span className="text-xl font-bold">Entix</span>
            </div>

            <div className="px-4 py-2">
                <OrganizationSwitcher />
            </div>



            {/* Menu */}
            <div className="flex-1 overflow-y-auto py-2">
                <SidebarMenu />
            </div>



            {/* User Profile / Footer */}
            <div className="p-4">
                {isLoading ? (
                    <Skeleton active avatar paragraph={{ rows: 1 }} />
                ) : (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
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
                            <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} trigger={['click']} placement="topRight">
                                <Button type="text" icon={<MoreOutlined />} className="flex-shrink-0 text-gray-500 hover:text-gray-700" />
                            </Dropdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
