import { BookOutlined, CalendarOutlined, RightOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useOrganization, useOrgNavigate } from "@web/src/features/organization";
import { useMyEnrollments } from "@web/src/features/schedule/hooks/useSchedule";
import { DateUtils } from "@web/src/utils/date";
import { Alert, Button, Card, Col, Empty, List, Row, Space, Typography, theme } from "antd";
import type React from "react";
import { useMemo } from "react";
import { Link } from "react-router";

const { Title, Text } = Typography;

export const StudentPortal: React.FC = () => {
    const navigateOrg = useOrgNavigate();
    const { activeOrganization } = useOrganization();
    const orgSlug = activeOrganization?.slug;
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

        const source = upcoming.length > 0 ? upcoming : sorted;
        return source.slice(0, 5);
    }, [enrollments]);

    const nextSession = myDisplaySessions[0];

    return (
        <div>
            <div className="mb-8">
                <Text
                    className="uppercase tracking-[0.14em] text-xs font-semibold"
                    style={{ color: token.colorPrimary }}
                >
                    {activeOrganization?.name || "Entix"}
                </Text>
                <Title level={2} className="!mt-2 !mb-1 font-display">
                    Continue learning
                </Title>
                <Text type="secondary">Your lessons and upcoming sessions, in one place.</Text>
            </div>

            <Row gutter={[20, 20]} className="mb-8">
                <Col xs={24} sm={12}>
                    <Card
                        hoverable
                        className="h-full border-0 shadow-sm"
                        styles={{ body: { padding: 24 } }}
                        onClick={() => navigateOrg(AppRoutes.org.dashboard.lessons)}
                    >
                        <BookOutlined
                            style={{ fontSize: 28, color: token.colorPrimary, marginBottom: 12 }}
                        />
                        <Title level={4} className="!mb-1">
                            My Lessons
                        </Title>
                        <Text type="secondary">Open courses and study materials.</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12}>
                    <Card
                        hoverable
                        className="h-full border-0 shadow-sm"
                        styles={{ body: { padding: 24 } }}
                        onClick={() => navigateOrg(AppRoutes.org.dashboard.mySchedule)}
                    >
                        <CalendarOutlined
                            style={{ fontSize: 28, color: token.colorPrimary, marginBottom: 12 }}
                        />
                        <Title level={4} className="!mb-1">
                            My Schedule
                        </Title>
                        <Text type="secondary">See all enrolled sessions.</Text>
                    </Card>
                </Col>
            </Row>

            {nextSession && (
                <Card
                    className="mb-6 border-0 shadow-sm"
                    styles={{
                        body: {
                            padding: 20,
                            background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 70%)`,
                        },
                    }}
                >
                    <Text type="secondary" className="text-xs uppercase tracking-wide">
                        Up next
                    </Text>
                    <Title level={4} className="!mt-1 !mb-2">
                        {nextSession.lessonTitle}
                    </Title>
                    <Text type="secondary">
                        {DateUtils.format(nextSession.startTime, "ddd, MMM D · h:mm A")}
                        {nextSession.teacherName ? ` · ${nextSession.teacherName}` : ""}
                    </Text>
                    <div className="mt-4">
                        <Button
                            type="primary"
                            icon={<RightOutlined />}
                            onClick={() =>
                                navigateOrg(
                                    AppRoutes.org.dashboard.lessonStudy(nextSession.lessonId)
                                )
                            }
                        >
                            Open lesson
                        </Button>
                    </div>
                </Card>
            )}

            <Card
                title="Upcoming sessions"
                className="border-0 shadow-sm"
                extra={
                    <Button
                        type="link"
                        onClick={() => navigateOrg(AppRoutes.org.dashboard.mySchedule)}
                    >
                        View all
                    </Button>
                }
            >
                {error && (
                    <Alert
                        type="warning"
                        showIcon
                        className="mb-3"
                        message="Unable to load sessions right now."
                        description={error.message}
                    />
                )}
                <List
                    loading={isLoading}
                    dataSource={myDisplaySessions}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="No sessions assigned yet. Check back after your school schedules classes."
                            />
                        ),
                    }}
                    renderItem={(item) => (
                        <List.Item>
                            <List.Item.Meta
                                title={
                                    orgSlug ? (
                                        <Link
                                            to={`/org/${orgSlug}${AppRoutes.org.dashboard.lessonStudy(item.lessonId)}`}
                                            className="text-inherit hover:!text-[var(--ant-color-primary)]"
                                        >
                                            <Text strong>{item.lessonTitle}</Text>
                                        </Link>
                                    ) : (
                                        <Text strong>{item.lessonTitle}</Text>
                                    )
                                }
                                description={
                                    <Space direction="vertical" size={0}>
                                        <Text type="secondary">
                                            {DateUtils.format(item.startTime, "MMM D, h:mm A")} –{" "}
                                            {DateUtils.format(item.endTime, "h:mm A")}
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
    );
};
