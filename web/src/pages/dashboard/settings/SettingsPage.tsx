import { SettingOutlined } from "@ant-design/icons";
import { ThemeSelector, TimezoneSelector } from "@web/src/features/user-profiles";
import { Card, Col, Row, Space, Typography } from "antd";

const { Title, Text } = Typography;

export const SettingsPage = () => {
    // Changed from React.FC

    return (
        <div>
            <div className="max-w-3xl">
                <div style={{ marginBottom: 32 }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Settings
                    </Title>
                    <Text type="secondary">Manage your account settings and preferences</Text>
                </div>

                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    {/* UI Preferences Card */}
                    <Card className="shadow-sm">
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                            <SettingOutlined
                                style={{ fontSize: 20, marginRight: 12, color: "#2563eb" }}
                            />
                            <Title level={4} style={{ margin: 0 }}>
                                UI Preferences
                            </Title>
                        </div>
                        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                            Configure default environment settings like local timezone and interface
                            theme matching your workflows natively.
                        </Text>
                        <Row gutter={[24, 24]}>
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
                    </Card>
                </Space>
            </div>
        </div>
    );
};

export default SettingsPage;
