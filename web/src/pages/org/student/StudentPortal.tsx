import { BookOutlined, ShoppingOutlined, WalletOutlined, YoutubeOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useOrganization, useOrgNavigate } from "@web/src/features/organization";
import { useMyEnrollments } from "@web/src/features/schedule/hooks/useSchedule";
import { DateUtils } from "@web/src/utils/date";
import { Alert, Card, Col, List, Row, Space, Typography, theme } from "antd";
import type React from "react";
import { useMemo } from "react";

const { Title, Text } = Typography;

export const StudentPortal: React.FC = () => {
    const navigateOrg = useOrgNavigate();
    const { activeOrganization } = useOrganization();
    const { token } = theme.useToken();
    const { data: enrollments = [], isLoading, error } = useMyEnrollments(activeOrganization?.id);

    const myDisplaySessions = useMemo(() => {
        const sorted = [...enrollments].sort(
            (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );

        const now = Date.now();
        const upcoming = sorted.filter((item) => {
            const parsed = new Date(item.startTime).getTime();
            if (Number.isNaN(parsed)) return true;
            return parsed >= now;
        });

        // If clock parsing/timezone edge cases hide "upcoming", still show enrolled sessions.
        const source = upcoming.length > 0 ? upcoming : sorted;
        return source.slice(0, 5);
    }, [enrollments]);

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
                <Card title="My Upcoming Sessions" className="shadow-sm">
                    {error && (
                        <Alert
                            type="warning"
                            showIcon
                            style={{ marginBottom: 12 }}
                            message="Unable to load enrollment sessions right now."
                            description={error.message}
                        />
                    )}
                    <List
                        loading={isLoading}
                        dataSource={myDisplaySessions}
                        locale={{
                            emptyText: (
                                <Text type="secondary" italic>
                                    No assigned sessions yet.
                                </Text>
                            ),
                        }}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={<Text strong>{item.lessonTitle}</Text>}
                                    description={
                                        <Space direction="vertical" size={0}>
                                            <Text type="secondary">
                                                {DateUtils.format(item.startTime, "MMM D, h:mm A")}{" "}
                                                - {DateUtils.format(item.endTime, "h:mm A")}
                                            </Text>
                                            <Text type="secondary">
                                                Teacher: {item.teacherName || "Unassigned"}
                                            </Text>
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            </div>
        </div>
    );
};
