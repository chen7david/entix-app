import React from 'react';
import { Avatar, Button, Typography, Skeleton } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { SidebarMenu } from './SidebarMenu';
import { useAuth } from '@web/src/hooks/auth/auth.hook';
import { useNavigate } from 'react-router';
import { links } from '@web/src/constants/links';

const { Text } = Typography;

export const SidebarContent: React.FC = () => {
    const { session, isLoading } = useAuth();
    const navigate = useNavigate();

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
                        <div className="flex items-center gap-3">
                            <Avatar size="large" icon={<UserOutlined />} src={session.data.user?.image} />
                            <div className="flex flex-col overflow-hidden">
                                <Text strong className="truncate">{session.data.user?.name}</Text>
                                <Text type="secondary" className="text-xs truncate">{session.data.user?.email}</Text>
                            </div>
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
