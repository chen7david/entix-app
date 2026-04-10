import { BookOutlined, ShoppingOutlined, WalletOutlined, YoutubeOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useOrgNavigate } from "@web/src/features/organization";
import { Card, Col, Row, Typography, theme } from "antd";
import type React from "react";

const { Title, Text } = Typography;

export const StudentPortal: React.FC = () => {
    const navigateOrg = useOrgNavigate();
    const { token } = theme.useToken();

    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0 }}>
                    Welcome to Entix Academy
                </Title>
                <Text type="secondary">Your portal for lessons, entertainment, and rewards.</Text>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        hoverable
                        className="h-full shadow-sm text-center"
                        onClick={() => navigateOrg(AppRoutes.org.dashboard.lessons)}
                    >
                        <BookOutlined
                            style={{ fontSize: 32, color: token.colorPrimary, marginBottom: 16 }}
                        />
                        <Title level={4}>My Lessons</Title>
                        <Text type="secondary">Access your classroom.</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        hoverable
                        className="h-full shadow-sm text-center"
                        onClick={() => navigateOrg(AppRoutes.org.dashboard.wallet)}
                    >
                        <WalletOutlined
                            style={{ fontSize: 32, color: token.colorSuccess, marginBottom: 16 }}
                        />
                        <Title level={4}>Wallet</Title>
                        <Text type="secondary">Check your balance.</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        hoverable
                        className="h-full shadow-sm text-center"
                        onClick={() => navigateOrg(AppRoutes.org.dashboard.movies)}
                    >
                        <YoutubeOutlined
                            style={{ fontSize: 32, color: token.colorError, marginBottom: 16 }}
                        />
                        <Title level={4}>Movies</Title>
                        <Text type="secondary">Watch and learn.</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        hoverable
                        className="h-full shadow-sm text-center"
                        onClick={() => navigateOrg(AppRoutes.org.dashboard.shop)}
                    >
                        <ShoppingOutlined
                            style={{ fontSize: 32, color: token.colorWarning, marginBottom: 16 }}
                        />
                        <Title level={4}>Shop</Title>
                        <Text type="secondary">Redeem your E$.</Text>
                    </Card>
                </Col>
            </Row>

            <div className="mt-8">
                <Card title="Recent Activity" className="shadow-sm">
                    <Text type="secondary" italic>
                        No recent lessons or transactions to show.
                    </Text>
                </Card>
            </div>
        </div>
    );
};
