import React from 'react';
import { Button, Avatar, Typography, message, Menu } from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    DashboardOutlined
} from '@ant-design/icons';
import { useAtomValue } from 'jotai';
import { useNavigate, useLocation } from 'react-router';
import { sidebarOpenAtom } from '../../atoms/layout/sidebarAtom';
import { signOut } from '../../lib/auth-client';
import { links } from '../../constants/links';
import { useCurrentUser } from '../../hooks/useCurrentUser';

const { Text } = Typography;

export const DashboardSidebar: React.FC = () => {
    const sidebarOpen = useAtomValue(sidebarOpenAtom);
    const { data: session } = useCurrentUser();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await signOut({
                fetchOptions: {
                    onSuccess: () => {
                        message.success('Logged out successfully');
                        navigate(links.auth.signIn);
                    },
                },
            });
        } catch (error) {
            message.error('Failed to log out');
        }
    };

    const menuItems = [
        {
            key: links.dashboard.profile,
            icon: <DashboardOutlined />,
            label: 'Profile',
            onClick: () => navigate(links.dashboard.profile),
        },
    ];

    return (
        <aside
            className={`fixed left-0 top-16 bottom-0 z-10 bg-white border-r border-gray-200 transition-all duration-200 flex flex-col ${sidebarOpen ? 'w-[250px]' : 'w-[80px]'
                }`}
        >
            {/* User Profile Section */}
            <div className={`p-4 border-b border-gray-100 flex items-center transition-all duration-200 ${!sidebarOpen ? 'justify-center' : 'gap-3'}`}>
                <Avatar
                    size={!sidebarOpen ? 40 : 48}
                    icon={<UserOutlined />}
                    src={session?.user?.image}
                    className="transition-all duration-200 shrink-0"
                />
                <div className={`flex flex-col overflow-hidden transition-all duration-200 ${!sidebarOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                    <Text strong className="truncate">{session?.user?.name}</Text>
                    <Text type="secondary" className="text-xs truncate">{session?.user?.email}</Text>
                </div>
            </div>

            {/* Navigation Menu - Independently Scrollable */}
            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    className="border-none"
                    style={{ background: 'transparent' }}
                    inlineCollapsed={!sidebarOpen}
                />
            </div>

            {/* Logout Button - Fixed at Bottom */}
            <div className="p-4 border-t border-gray-100 mt-auto">
                <Button
                    type="text"
                    danger
                    block={sidebarOpen}
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                    className={`flex items-center ${!sidebarOpen ? 'justify-center' : 'justify-start'}`}
                >
                    <span className={`transition-all duration-200 ${!sidebarOpen ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block ml-2'}`}>
                        Logout
                    </span>
                </Button>
            </div>
        </aside>
    );
};
