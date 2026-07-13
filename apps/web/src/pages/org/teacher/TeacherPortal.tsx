import {
    CalendarOutlined,
    ClockCircleOutlined,
    OrderedListOutlined,
    PlaySquareOutlined,
    PlusOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import { useAuth } from "@web/src/features/auth";
import { useOrganization, useOrgNavigate } from "@web/src/features/organization";
import { useSchedule } from "@web/src/features/schedule/hooks/useSchedule";
import { DateUtils } from "@web/src/utils/date";
import { Button, Card, Col, Empty, List, Row, Space, Typography } from "antd";
import type React from "react";
import { useMemo } from "react";

const { Text } = Typography;

export const TeacherPortal: React.FC = () => {
    const navigateOrg = useOrgNavigate();
    const { activeOrganization } = useOrganization();
    const { user } = useAuth();
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
        <PageShell fill={false}>
            <PageHeader
                eyebrow="Teaching"
                title="Your classroom"
                subtitle="Run sessions, lessons, and student lists."
                actions={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigateOrg(AppRoutes.org.teaching.sessions)}
                    >
                        Manage sessions
                    </Button>
                }
            />

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card title="Upcoming classes" className="border-0 shadow-sm h-full">
                        <List
                            loading={isLoading}
                            dataSource={myUpcomingSessions}
                            locale={{
                                emptyText: (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="No classes scheduled for you yet."
                                    >
                                        <Button
                                            type="primary"
                                            onClick={() =>
                                                navigateOrg(AppRoutes.org.teaching.sessions)
                                            }
                                        >
                                            Open schedule
                                        </Button>
                                    </Empty>
                                ),
                            }}
                            renderItem={(item) => (
                                <List.Item
                                    actions={[
                                        <Button
                                            key="open"
                                            type="link"
                                            onClick={() =>
                                                navigateOrg(
                                                    `${AppRoutes.org.teaching.sessions}/${item.id}`
                                                )
                                            }
                                        >
                                            Open
                                        </Button>,
                                    ]}
                                >
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
                    <Card title="Quick actions" className="border-0 shadow-sm">
                        <Space direction="vertical" className="w-full">
                            <Button
                                block
                                size="large"
                                icon={<CalendarOutlined />}
                                onClick={() => navigateOrg(AppRoutes.org.teaching.sessions)}
                            >
                                Sessions
                            </Button>
                            <Button
                                block
                                size="large"
                                icon={<PlaySquareOutlined />}
                                onClick={() => navigateOrg(AppRoutes.org.teaching.media)}
                            >
                                Media library
                            </Button>
                            <Button
                                block
                                size="large"
                                icon={<OrderedListOutlined />}
                                onClick={() => navigateOrg(AppRoutes.org.teaching.vocabulary)}
                            >
                                Vocabulary
                            </Button>
                            <Button
                                block
                                size="large"
                                icon={<TeamOutlined />}
                                onClick={() => navigateOrg(AppRoutes.org.teaching.students)}
                            >
                                Students
                            </Button>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </PageShell>
    );
};
