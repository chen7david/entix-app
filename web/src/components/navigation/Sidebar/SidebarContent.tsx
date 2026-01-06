import React from 'react';
import { Avatar, Button, Typography, Divider, Skeleton } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { SidebarMenu } from './SidebarMenu';
import { useAuth } from '@web/src/hooks/auth/auth.hook';
import { useNavigate } from 'react-router';
import { links } from '@web/src/constants/links';

const { Title, Text } = Typography;

export const SidebarContent: React.FC = () => {
    const { signOut, session, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        signOut();
        navigate(links.auth.signIn);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header / Logo */}
            <div className="p-4 bg-gray-100 flex items-center h-14">
                <span className="text-lg font-bold">Entix</span>
            </div>



            {/* Menu */}
            <div className="flex-1 overflow-y-auto py-2">
                <SidebarMenu />
            </div>



            {/* User Profile / Footer */}
            <div className="p-4 bg-gray-50">
                {isLoading ? (
                    <Skeleton active avatar paragraph={{ rows: 1 }} />
                ) : session.data ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <Avatar size="large" icon={<UserOutlined />} src={session.data.user?.image} />
                            <div className="flex flex-col overflow-hidden">
                                <Text strong className="truncate">{session.data.user?.name}</Text>
                                <Text type="secondary" className="text-xs truncate">{session.data.user?.email}</Text>
                            </div>
                        </div>
                        <Button
                            type="text"
                            danger
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                            block
                            className="flex items-center justify-start pl-0 hover:bg-red-50"
                        >
                            Logout
                        </Button>
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
