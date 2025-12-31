import React from 'react';
import { Button, Avatar, Typography, message, Menu, Grid, Drawer } from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    DashboardOutlined,
    CloseOutlined
} from '@ant-design/icons';
import { useAtomValue, useSetAtom } from 'jotai';
import { useNavigate, useLocation } from 'react-router';
import { sidebarOpenAtom } from '../../atoms/layout/sidebarAtom';
import { signOut } from '../../lib/auth-client';
import { links } from '../../constants/links';
import { useCurrentUser } from '../../hooks/useCurrentUser';

const { Text } = Typography;
const { useBreakpoint } = Grid;

export const DashboardSidebar: React.FC = () => {
    const sidebarOpen = useAtomValue(sidebarOpenAtom);
    const setSidebarOpen = useSetAtom(sidebarOpenAtom);
    const { data: session } = useCurrentUser();
    const navigate = useNavigate();
    const location = useLocation();
    const screens = useBreakpoint();

    // md is the breakpoint where we switch from mobile drawer to desktop sidebar
    const isMobile = screens.md === false;

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
            onClick: () => {
                navigate(links.dashboard.profile);
                if (isMobile) {
                    setSidebarOpen(false);
                }
            },
        },
    ];

    const sidebarContent = (
        <div className="flex flex-col h-full bg-white">
            {/* Mobile Close Button Header */}
            {isMobile && (
                <div className="flex justify-end p-4 border-b border-gray-100">
                    <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={() => setSidebarOpen(false)}
                    />
                </div>
            )}

            {/* User Profile Section */}
            <div className={`p-4 border-b border-gray-100 flex items-center transition-all duration-200 
                ${!isMobile && !sidebarOpen ? 'justify-center px-0' : 'gap-3 px-4'}
            `}>
                <div className="shrink-0 flex items-center justify-center">
                    <Avatar
                        size={!isMobile && !sidebarOpen ? 40 : 48}
                        className="transition-all duration-200"
                        icon={<UserOutlined />}
                        src={session?.user?.image}
                    />
                </div>
                <div className={`flex flex-col overflow-hidden transition-all duration-200 
                    ${!isMobile && !sidebarOpen ? 'w-0 opacity-0 pointer-events-none' : 'w-auto opacity-100'}
                `}>
                    <Text strong className="truncate leading-tight">{session?.user?.name}</Text>
                    <Text type="secondary" className="text-xs truncate">{session?.user?.email}</Text>
                </div>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    className="border-none"
                    style={{ background: 'transparent' }}
                    inlineCollapsed={!isMobile && !sidebarOpen}
                />
            </div>

            {/* Logout Button */}
            <div className={`p-4 border-t border-gray-100 mt-auto transition-all duration-200 
                ${!isMobile && !sidebarOpen ? 'px-2' : 'px-4'}
            `}>
                <Button
                    type="text"
                    danger
                    block={!isMobile && !sidebarOpen ? false : true}
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                    className={`flex items-center transition-all duration-200 
                        ${!isMobile && !sidebarOpen ? 'justify-center' : 'justify-start'}
                    `}
                >
                    <span className={`transition-all duration-200 overflow-hidden 
                        ${!isMobile && !sidebarOpen ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block ml-2'}
                    `}>
                        Logout
                    </span>
                </Button>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer
                placement="left"
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                width="85%"
                closable={false}
                styles={{ body: { padding: 0 }, wrapper: { maxWidth: 300 } }}
            >
                {sidebarContent}
            </Drawer>
        );
    }

    return (
        <aside
            className={`
                fixed left-0 top-16 bottom-0 z-30 bg-white border-r border-gray-200
                transition-all duration-200 flex flex-col
                ${sidebarOpen ? 'w-[250px]' : 'w-[80px]'}
            `}
        >
            {sidebarContent}
        </aside>
    );
};
