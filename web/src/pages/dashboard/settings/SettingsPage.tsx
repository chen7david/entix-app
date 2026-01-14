import React from 'react';
import { useNavigate } from 'react-router';
import { Card, Typography, Divider, Button, Space } from 'antd';
import { LockOutlined, RightOutlined } from '@ant-design/icons';
import { links } from '@web/src/constants/links';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';

const { Title, Text } = Typography;

export const SettingsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <>
            <Toolbar />
            <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                <Card>
                    <Title level={3}>Settings</Title>
                    <Text type="secondary">Manage your account settings and preferences</Text>

                    <Divider />

                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                <LockOutlined style={{ fontSize: 20, marginRight: 12 }} />
                                <Title level={4} style={{ margin: 0 }}>Password</Title>
                            </div>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                                Change your password to keep your account secure. You'll need to enter your current password to make changes.
                            </Text>
                            <Button
                                type="default"
                                icon={<RightOutlined />}
                                iconPosition="end"
                                onClick={() => navigate(links.dashboard.changePassword)}
                            >
                                Change Password
                            </Button>
                        </div>
                    </Space>
                </Card>
            </div>
        </>
    );
};
