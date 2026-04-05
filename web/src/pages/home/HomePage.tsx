import {
    ArrowRightOutlined,
    GiftOutlined,
    LineChartOutlined,
    NotificationOutlined,
    TeamOutlined,
    ThunderboltOutlined,
    UploadOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { SessionVolumeChart, useAnalytics } from "@web/src/features/analytics";
import { DashboardMetricCards } from "@web/src/features/dashboard";
import { useBulkMembers, useOrganization, useOrgNavigate } from "@web/src/features/organization";
import { DateUtils } from "@web/src/utils/date";
import { Alert, Button, Card, Col, Divider, Row, Space, Typography } from "antd";
import type React from "react";

const { Title, Text } = Typography;

export const HomePage: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const navigateOrg = useOrgNavigate();
    const { metrics, isLoadingMetrics } = useBulkMembers(activeOrganization?.id);

    // Default to last 30 days for activity chart
    const queryEnd = DateUtils.endOf("day");
    const queryStart = DateUtils.offsetStartOf(-30, "day", "day");

    const { sessionTrends, isLoadingSessions } = useAnalytics(
        activeOrganization?.id,
        queryStart,
        queryEnd
    );

    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0 }}>
                    Organization Dashboard
                </Title>
                <Text type="secondary">
                    Welcome back to {activeOrganization?.name}. Your central command for
                    organization health.
                </Text>
            </div>

            <DashboardMetricCards metrics={metrics} loading={isLoadingMetrics} />

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <span>
                                <LineChartOutlined className="mr-2" /> Member Activity (Last 30
                                Days)
                            </span>
                        }
                        className="shadow-sm h-full"
                    >
                        <SessionVolumeChart data={sessionTrends} isLoading={isLoadingSessions} />
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Space orientation="vertical" className="w-full" size="middle">
                        <Card
                            title={
                                <span>
                                    <ThunderboltOutlined className="mr-2 text-yellow-500" /> Quick
                                    Actions
                                </span>
                            }
                            className="shadow-sm"
                        >
                            <Space orientation="vertical" className="w-full">
                                <Button
                                    block
                                    icon={<TeamOutlined />}
                                    onClick={() => navigateOrg(AppRoutes.org.manage.members)}
                                >
                                    Manage Members
                                </Button>
                                <Button
                                    block
                                    icon={<UploadOutlined />}
                                    onClick={() => navigateOrg("/manage/bulk")}
                                >
                                    Bulk Import/Export
                                </Button>
                                <Divider className="my-2" />
                                <Button
                                    type="link"
                                    block
                                    onClick={() => navigateOrg(AppRoutes.org.manage.analytics)}
                                >
                                    View Full Analytics <ArrowRightOutlined />
                                </Button>
                            </Space>
                        </Card>

                        <Card
                            title={
                                <span>
                                    <GiftOutlined className="mr-2 text-rose-500" /> Upcoming
                                    Birthdays
                                </span>
                            }
                            className="shadow-sm"
                        >
                            {metrics?.upcomingBirthdays && metrics.upcomingBirthdays.length > 0 ? (
                                <div className="space-y-4">
                                    {metrics.upcomingBirthdays.map((b) => (
                                        <div
                                            key={b.userId}
                                            className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0"
                                        >
                                            <div>
                                                <div className="font-medium">{b.name}</div>
                                                <Text type="secondary" className="text-xs">
                                                    {DateUtils.format(b.birthDate, "MMMM D")}
                                                </Text>
                                            </div>
                                            <div className="text-rose-500 text-xs font-semibold">
                                                {b.daysUntil === 0
                                                    ? "Today!"
                                                    : `in ${b.daysUntil} days`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Text type="secondary" italic>
                                    No birthdays in the next 7 days.
                                </Text>
                            )}
                        </Card>

                        <Card
                            title={
                                <span>
                                    <WarningOutlined className="mr-2 text-orange-500" /> Engagement
                                    Risk
                                </span>
                            }
                            className="shadow-sm"
                        >
                            {metrics && metrics.engagementRisk > 0 ? (
                                <div className="text-center py-2">
                                    <Title level={3} className="m-0 text-orange-500">
                                        {metrics.engagementRisk}
                                    </Title>
                                    <Text type="secondary">
                                        Members have zero activity in the last 14 days.
                                    </Text>
                                    <Button
                                        type="primary"
                                        ghost
                                        className="mt-4"
                                        icon={<NotificationOutlined />}
                                        onClick={() => navigateOrg(AppRoutes.org.manage.members)}
                                    >
                                        Review Members
                                    </Button>
                                </div>
                            ) : (
                                <Alert
                                    title="Healthy Engagement"
                                    description="All members have been active recently."
                                    type="success"
                                    showIcon
                                />
                            )}
                        </Card>
                    </Space>
                </Col>
            </Row>
        </div>
    );
};

export default HomePage;
