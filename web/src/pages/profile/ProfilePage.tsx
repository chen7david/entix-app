import React from 'react';
import { Card, Avatar, Typography, Button, Descriptions, Spin, message } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useSession, signOut } from '../../lib/auth-client';
import { useNavigate } from 'react-router';
import { links } from '../../constants/links';
const { Title } = Typography;

export const ProfilePage: React.FC = () => {
    const { data: session, isPending } = useSession();
    const navigate = useNavigate();

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
        } catch {
            message.error('Failed to log out');
        }
    };

    if (isPending) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!session) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Card style={{ textAlign: 'center' }}>
                    <Title level={4}>You are not logged in</Title>
                    <Button type="primary" onClick={() => navigate(links.auth.signIn)}>
                        Go to Sign In
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <Card
                actions={[
                    <Button type="text" danger icon={<LogoutOutlined />} onClick={handleLogout}>
                        Logout
                    </Button>
                ]}
            >
                <Card.Meta
                    avatar={<Avatar size={64} icon={<UserOutlined />} src={session.user.image} />}
                    title={<Title level={3}>{session.user.name}</Title>}
                    description={session.user.email}
                />
                <div style={{ marginTop: '24px' }}>
                    <Descriptions title="User Information" bordered column={1}>
                        <Descriptions.Item label="ID">{session.user.id}</Descriptions.Item>
                        <Descriptions.Item label="Email">{session.user.email}</Descriptions.Item>
                        <Descriptions.Item label="Name">{session.user.name}</Descriptions.Item>
                        <Descriptions.Item label="Verified">
                            {session.user.emailVerified ? 'Yes' : 'No'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Created At">
                            {new Date(session.user.createdAt).toLocaleString()}
                        </Descriptions.Item>
                    </Descriptions>
                </div>
            </Card>
        </div>
    );
};
