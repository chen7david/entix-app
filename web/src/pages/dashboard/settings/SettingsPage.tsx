import { SettingOutlined } from "@ant-design/icons";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { ThemeSelector } from "@web/src/components/profile/ThemeSelector";
import { TimezoneSelector } from "@web/src/components/profile/TimezoneSelector";
import { Card, Col, Row, Space, Typography } from "antd";

const { Title, Text } = Typography;

export const SettingsPage = () => {
    // Changed from React.FC

    return (
        <>
            <Toolbar />
            <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
                <Title level={3} style={{ marginBottom: 4 }}>
                    Settings
                </Title>
                <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
                    Manage your account settings and preferences
                </Text>

                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    {/* UI Preferences Card */}
                    <Card className="shadow-sm">
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                            <SettingOutlined
                                style={{ fontSize: 20, marginRight: 12, color: "#646cff" }}
                            />
                            <Title level={4} style={{ margin: 0 }}>
                                UI Preferences
                            </Title>
                        </div>
                        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                            Configure default environment settings like local timezone and interface
                            theme matching your workflows natively.
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
                    </Card>
                </Space>
            </div>
        </>
    );
};
