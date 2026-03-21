import { useNavigate } from 'react-router';
import { Card, Typography, Divider, Button, Space, Row, Col } from 'antd';
import { LockOutlined, RightOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { links } from '@shared/constants/links';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';
import { useSignOut } from '@web/src/hooks/auth/useAuth';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';
import { TimezoneSelector } from '@web/src/components/profile/TimezoneSelector';
import { ThemeSelector } from '@web/src/components/profile/ThemeSelector';

const { Title, Text } = Typography;

export const SettingsPage = () => { // Changed from React.FC
    const navigate = useNavigate();
    const { activeOrganization } = useOrganization(); // Added this line
    const { mutate: signOut } = useSignOut();

    const handleLogout = () => {
        signOut(undefined, {
            onSuccess: () => {
                navigate(links.auth.signIn);
            }
        });
    };

    return (
        <>
            <Toolbar />
            <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                <Card>
                    <Title level={3}>Settings</Title>
                    <Text type="secondary">Manage your account settings and preferences</Text>

                    <Divider />

                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        {/* Preferences Section */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                <SettingOutlined style={{ fontSize: 20, marginRight: 12, color: '#646cff' }} />
                                <Title level={4} style={{ margin: 0 }}>Preferences</Title>
                            </div>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                                Configure default environment settings like local timezone and interface theme matching your workflows natively.
                            </Text>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={12}>
                                    <div className="mb-2">
                                        <Text strong>Timezone</Text>
                                    </div>
                                    <TimezoneSelector />
                                </Col>
                                <Col xs={24} md={12}>
                                    <div className="mb-2">
                                        <Text strong>Theme</Text>
                                    </div>
                                    <ThemeSelector />
                                </Col>
                            </Row>
                        </div>

                        <Divider />

                        {/* Password Section */}
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
                                onClick={() => activeOrganization?.slug && navigate(links.dashboard.changePassword(activeOrganization.slug))}
                            >
                                Change Password
                            </Button>
                        </div>

                        <Divider />

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                <LogoutOutlined style={{ fontSize: 20, marginRight: 12, color: '#ff4d4f' }} />
                                <Title level={4} type="danger" style={{ margin: 0 }}>Sign Out</Title>
                            </div>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                                Sign out of your account on this device.
                            </Text>
                            <Button
                                danger
                                onClick={handleLogout}
                            >
                                Sign Out
                            </Button>
                        </div>
                    </Space>
                </Card>
            </div>
        </>
    );
};
