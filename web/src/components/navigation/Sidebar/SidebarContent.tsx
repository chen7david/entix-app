import React from 'react';
import { Avatar, Button, Typography, Skeleton, Dropdown, type MenuProps } from 'antd';
import { UserOutlined, MoreOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { SidebarMenu } from './SidebarMenu';
import { useAuth, useSignOut } from '@web/src/hooks/auth/auth.hook';
import { useNavigate } from 'react-router';
import { links } from '@web/src/constants/links';

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



            {/* Menu */}
            <div className="flex-1 overflow-y-auto py-2">
                <SidebarMenu />
            </div>



            {/* User Profile / Footer */}
            <div className="p-4">
                {isLoading ? (
                    <Skeleton active avatar paragraph={{ rows: 1 }} />
                ) : session.data ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Avatar size="large" icon={<UserOutlined />} src={session.data.user?.image} />
                                <div className="flex flex-col overflow-hidden">
                                    <Text strong className="truncate">{session.data.user?.name}</Text>
                                    <Text type="secondary" className="text-xs truncate">{session.data.user?.email}</Text>
                                </div>
                            </div>
                            <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="topRight" trigger={['click']}>
                                <Button type="text" icon={<MoreOutlined />} />
                            </Dropdown>
                        </div>
                    </div>
                ) : (
                    <Button type="primary" block onClick={() => navigate(links.auth.signIn)}>
                        Sign In
                    </Button>
                )}
            </div>
        </div>
    );
};
