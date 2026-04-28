import {
    CalendarOutlined,
    ClockCircleOutlined,
    OrderedListOutlined,
    PlaySquareOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useAuth } from "@web/src/features/auth";
import { useOrganization, useOrgNavigate } from "@web/src/features/organization";
import { useSchedule } from "@web/src/features/schedule/hooks/useSchedule";
import { DateUtils } from "@web/src/utils/date";
import { Button, Card, Col, List, Row, Space, Typography, theme } from "antd";
import type React from "react";
import { useMemo } from "react";

const { Title, Text } = Typography;

export const TeacherPortal: React.FC = () => {
    const navigateOrg = useOrgNavigate();
    const { activeOrganization } = useOrganization();
    const { user } = useAuth();
    const { token } = theme.useToken();
    const { sessions, isLoading } = useSchedule(activeOrganization?.id, Date.now(), undefined);

    const myUpcomingSessions = useMemo(
        () =>
            (sessions || [])
                .filter(
                    (session) => session.teacherId === user?.id && session.startTime >= Date.now()
                )
                .sort((a, b) => a.startTime - b.startTime)
                .slice(0, 5),
        [sessions, user?.id]
    );

    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0 }}>
                    Teacher Dashboard
                </Title>
                <Text type="secondary">Manage your classes, media, and student engagement.</Text>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card title="Upcoming Classes" className="shadow-sm h-full">
                        <List
                            loading={isLoading}
                            dataSource={myUpcomingSessions}
                            locale={{
                                emptyText: (
                                    <Space direction="vertical" className="w-full text-center py-8">
                                        <CalendarOutlined
                                            style={{ fontSize: 48, color: token.colorTextDisabled }}
                                        />
                                        <Text type="secondary">No assigned classes scheduled.</Text>
                                        <Button
                                            type="primary"
                                            onClick={() =>
                                                navigateOrg(AppRoutes.org.teaching.schedule)
                                            }
                                        >
                                            Go to Schedule
                                        </Button>
                                    </Space>
                                ),
                            }}
                            renderItem={(item) => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={<Text strong>{item.title}</Text>}
                                        description={
                                            <Space size={8}>
                                                <ClockCircleOutlined />
                                                <Text type="secondary">
                                                    {DateUtils.format(
                                                        item.startTime,
                                                        "MMM D, h:mm A"
                                                    )}
                                                </Text>
                                                <Text type="secondary">
                                                    ({item.durationMinutes}m)
                                                </Text>
                                            </Space>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Space direction="vertical" className="w-full" size="middle">
                        <Card title="Quick Resources" className="shadow-sm">
                            <Space direction="vertical" className="w-full">
                                <Button
                                    block
                                    icon={<PlaySquareOutlined />}
                                    onClick={() => navigateOrg(AppRoutes.org.teaching.media)}
                                >
                                    Media Library
                                </Button>
                                <Button
                                    block
                                    icon={<OrderedListOutlined />}
                                    onClick={() => navigateOrg(AppRoutes.org.teaching.playlists)}
                                >
                                    Playlists
                                </Button>
                                <Button
                                    block
                                    icon={<TeamOutlined />}
                                    onClick={() => navigateOrg(AppRoutes.org.teaching.students)}
                                >
                                    Class Roster
                                </Button>
                            </Space>
                        </Card>
                        <Card title="Education Insights" className="shadow-sm">
                            <Text type="secondary" italic>
                                Student GPA trends, engagement scores, and attendance reports coming
                                soon.
                            </Text>
                        </Card>
                    </Space>
                </Col>
            </Row>
        </div>
    );
};
