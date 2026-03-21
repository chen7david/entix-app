import React from 'react';
import { Avatar, Button, Typography, Skeleton, Dropdown, type MenuProps, theme } from 'antd';
import { UserOutlined, MoreOutlined, SettingOutlined, LogoutOutlined, SafetyOutlined } from '@ant-design/icons';
import { SidebarMenu } from './SidebarMenu';
import { SidebarOrgSwitcher } from './SidebarOrgSwitcher';
import { useAuth, useSignOut } from '@web/src/hooks/auth/useAuth';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';
import { useNavigate } from 'react-router';
import { links } from '@shared/constants/links';
import { getAvatarUrl } from '@shared/utils/image-url';

const { Text } = Typography;

export const SidebarContent: React.FC = () => {
    const { session, isLoading, isSuperAdmin } = useAuth();
    const { mutate: signOut } = useSignOut();
    const { activeOrganization } = useOrganization();
    const navigate = useNavigate();
    const slug = activeOrganization?.slug || '';
    const { token } = theme.useToken();

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
        ...(isSuperAdmin ? [
            {
                key: links.admin.index,
                label: 'Admin Management',
                icon: <SafetyOutlined style={{ color: '#faad14' }} />,
            },
            {
                type: 'divider' as const,
            },
        ] : []),
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
                            src={getAvatarUrl(session.data?.user?.image, 'sm')}
                            icon={<UserOutlined />}
                            className="flex-shrink-0 border border-gray-200"
                        />
                        <div className="flex flex-col min-w-0">
                            <Text strong className="truncate text-sm">
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
            <div style={{ borderTop: `1px solid ${token.colorSplit}` }}>
                <div className="flex items-center gap-1 p-2">
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <SidebarOrgSwitcher />
                    </div>
                    <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} trigger={['click']} placement="topRight">
                        <Button type="text" icon={<MoreOutlined />} className="flex-shrink-0" />
                    </Dropdown>
                </div>
            </div>
        </div>
    );
};

