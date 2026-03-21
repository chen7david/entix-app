import React from 'react';
import { Card, Avatar, Typography, Button, Spin, App, Row, Col, Divider, Tooltip } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useSession, signOut } from '../../../lib/auth-client';
import { useNavigate } from 'react-router';
import { links } from '@shared/constants/links';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';
import { getAvatarUrl } from "@shared/utils/image-url";
import { AvatarDropzone } from '@web/src/components/Upload/AvatarDropzone';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';
import { DateUtils } from '@web/src/utils/date';

import { PasswordUpdateForm } from '@web/src/components/profile/PasswordUpdateForm';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
    const { message } = App.useApp();
    const { data: session, isPending } = useSession();
    const navigate = useNavigate();
    const { activeOrganization } = useOrganization();

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
        <>
            <Toolbar />
            <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={8}>
                        <Card
                            className="shadow-sm"
                            actions={[
                                <Button type="text" danger icon={<LogoutOutlined />} onClick={handleLogout}>
                                    Logout
                                </Button>
                            ]}
                        >
                            <div className="flex flex-col items-center mb-6 text-center">
                                {activeOrganization ? (
                                    <AvatarDropzone 
                                        organizationId={activeOrganization.id} 
                                        userId={session.user.id} 
                                        currentImageUrl={getAvatarUrl(session.user.image, 'lg')} 
                                        size={96} 
                                    />
                                ) : (
                                    <Avatar size={96} icon={<UserOutlined />} src={getAvatarUrl(session.user.image, 'lg')} />
                                )}
                                <Title level={4} style={{ marginTop: '16px', marginBottom: '4px' }}>{session.user.name}</Title>
                                <Text type="secondary">{session.user.email}</Text>
                            </div>

                            <Divider />

                            <div className="flex justify-between items-center py-2">
                                <Text type="secondary">Status</Text>
                                <Text>{session.user.emailVerified ? 'Verified' : 'Unverified'}</Text>
                            </div>
                            
                            <div className="flex justify-between items-center py-2">
                                <Text type="secondary">Joined</Text>
                                <Tooltip title={DateUtils.format(new Date(session.user.createdAt).getTime(), 'LLL')}>
                                    <Text>{DateUtils.fromNow(new Date(session.user.createdAt).getTime())}</Text>
                                </Tooltip>
                            </div>
                        </Card>
                    </Col>
                    
                    <Col xs={24} md={16}>
                        <div className="flex flex-col gap-6">
                              <PasswordUpdateForm />
                        </div>
                    </Col>
                </Row>
            </div>
        </>
    );
};
