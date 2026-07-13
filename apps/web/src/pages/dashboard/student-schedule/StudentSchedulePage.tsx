import { CalendarOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import { useOrganization, useOrgNavigate } from "@web/src/features/organization";
import { useMyEnrollments } from "@web/src/features/schedule/hooks/useSchedule";
import { DateUtils } from "@web/src/utils/date";
import { Alert, Button, Card, Empty, List, Space, Typography } from "antd";
import type React from "react";
import { useMemo } from "react";

const { Text } = Typography;

export const StudentSchedulePage: React.FC = () => {
    const navigateOrg = useOrgNavigate();
    const { activeOrganization } = useOrganization();
    const { data: enrollments = [], isLoading, error } = useMyEnrollments(activeOrganization?.id);

    const sorted = useMemo(
        () =>
            [...enrollments].sort(
                (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            ),
        [enrollments]
    );

    const upcoming = useMemo(() => {
        const now = Date.now();
        return sorted.filter((item) => {
            const parsed = new Date(item.startTime).getTime();
            if (Number.isNaN(parsed)) return true;
            return parsed >= now;
        });
    }, [sorted]);

    const past = useMemo(() => {
        const now = Date.now();
        return sorted
            .filter((item) => {
                const parsed = new Date(item.startTime).getTime();
                if (Number.isNaN(parsed)) return false;
                return parsed < now;
            })
            .reverse();
    }, [sorted]);

    return (
        <PageShell fill={false}>
            <PageHeader
                title="My Schedule"
                subtitle="All sessions you are enrolled in."
                actions={
                    <Button
                        type="primary"
                        icon={<CalendarOutlined />}
                        onClick={() => navigateOrg(AppRoutes.org.dashboard.lessons)}
                    >
                        My Lessons
                    </Button>
                }
            />

            {error && (
                <Alert
                    type="warning"
                    showIcon
                    className="mb-4"
                    message="Unable to load your schedule"
                    description={error.message}
                />
            )}

            <Card title="Upcoming" className="mb-4 border-0 shadow-sm">
                <List
                    loading={isLoading}
                    dataSource={upcoming}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="No upcoming sessions."
                            />
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
                                            AppRoutes.org.dashboard.lessonStudy(item.lessonId)
                                        )
                                    }
                                >
                                    Open lesson
                                </Button>,
                            ]}
                        >
                            <List.Item.Meta
                                title={<Text strong>{item.lessonTitle}</Text>}
                                description={
                                    <Space direction="vertical" size={0}>
                                        <Text type="secondary">
                                            {DateUtils.format(
                                                item.startTime,
                                                "ddd, MMM D · h:mm A"
                                            )}{" "}
                                            – {DateUtils.format(item.endTime, "h:mm A")}
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

            {past.length > 0 && (
                <Card title="Past" className="border-0 shadow-sm">
                    <List
                        dataSource={past.slice(0, 20)}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={<Text>{item.lessonTitle}</Text>}
                                    description={
                                        <Text type="secondary">
                                            {DateUtils.format(
                                                item.startTime,
                                                "MMM D, YYYY · h:mm A"
                                            )}
                                        </Text>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            )}
        </PageShell>
    );
};

export default StudentSchedulePage;
