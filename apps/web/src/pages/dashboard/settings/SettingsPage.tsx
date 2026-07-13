import { SettingOutlined } from "@ant-design/icons";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import { ThemeSelector, TimezoneSelector } from "@web/src/features/user-profiles";
import { Card, Col, Row, Typography, theme } from "antd";

const { Title, Text } = Typography;

export const SettingsPage = () => {
    const { token } = theme.useToken();

    return (
        <PageShell fill={false}>
            <PageHeader title="Settings" subtitle="Manage your account preferences." />

            <Card className="border-0 shadow-sm">
                <div className="flex items-center mb-2">
                    <SettingOutlined
                        style={{ fontSize: 20, marginRight: 12, color: token.colorPrimary }}
                    />
                    <Title level={4} style={{ margin: 0 }}>
                        Personal settings
                    </Title>
                </div>
                <Text type="secondary" className="block mb-4">
                    Configure timezone and interface theme for your workspace.
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
        </PageShell>
    );
};

export default SettingsPage;
