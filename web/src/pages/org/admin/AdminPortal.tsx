import {
    AttendanceTrendChart,
    SessionVolumeChart,
    useAnalytics,
} from "@web/src/features/analytics";
import {
    DashboardMetricCards,
    RecentTransactionsCard,
    UpcomingBirthdaysCard,
    UpcomingSessionsCard,
} from "@web/src/features/dashboard";
import { useBulkMembers, useOrganization } from "@web/src/features/organization";
import { DateUtils } from "@web/src/utils/date";
import { Col, Row, Select, Space, Typography } from "antd";
import { useState } from "react";

const { Title, Text } = Typography;

export const AdminPortal: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const { metrics, isLoadingMetrics } = useBulkMembers(activeOrganization?.id);

    // Dashboard defaults to "This Month" preset
    const [range, setRange] = useState<{ start: number; end: number; label: string }>({
        start: DateUtils.startOf("month"),
        end: DateUtils.endOf("month"),
        label: "This Month",
    });

    const { sessionTrends, isLoadingSessions, attendanceTrends, isLoadingAttendance } =
        useAnalytics(activeOrganization?.id, range.start, range.end);

    const handlePresetChange = (label: string) => {
        let start: number;
        let end: number;

        if (label === "This Month") {
            start = DateUtils.startOf("month");
            end = DateUtils.endOf("month");
        } else if (label === "Last 7 Days") {
            start = DateUtils.offsetStartOf(-7, "day", "day");
            end = DateUtils.endOf("day");
        } else if (label === "This Year") {
            start = DateUtils.startOf("year");
            end = DateUtils.endOf("year");
        } else if (label === "Last 30 Days") {
            start = DateUtils.offsetStartOf(-30, "day", "day");
            end = DateUtils.endOf("day");
        } else {
            // Default to Last 30 Days if somehow another label is passed
            start = DateUtils.offsetStartOf(-30, "day", "day");
            end = DateUtils.endOf("day");
        }

        setRange({ start, end, label });
    };

    return (
        <div className="pb-8">
            <Row justify="space-between" align="bottom" style={{ marginBottom: 32 }}>
                <Col>
                    <Title level={2} style={{ margin: 0 }}>
                        Organization Dashboard
                    </Title>
                    <Text type="secondary">
                        Welcome back to {activeOrganization?.name}. Your central command for
                        organization health.
                    </Text>
                </Col>
                <Col className="mt-4 md:mt-0">
                    <Space>
                        <Text
                            type="secondary"
                            className="text-xs font-medium uppercase tracking-wider"
                        >
                            Filter:
                        </Text>
                        <Select
                            value={range.label}
                            onChange={handlePresetChange}
                            className="min-w-[140px]"
                            options={[
                                { label: "Last 7 Days", value: "Last 7 Days" },
                                { label: "Last 30 Days", value: "Last 30 Days" },
                                { label: "This Month", value: "This Month" },
                                { label: "This Year", value: "This Year" },
                            ]}
                        />
                    </Space>
                </Col>
            </Row>

            <DashboardMetricCards metrics={metrics} loading={isLoadingMetrics} />

            <Row gutter={[24, 24]}>
                {/* Analytics Row */}
                <Col xs={24} lg={12}>
                    <SessionVolumeChart data={sessionTrends} isLoading={isLoadingSessions} />
                </Col>
                <Col xs={24} lg={12}>
                    <AttendanceTrendChart data={attendanceTrends} isLoading={isLoadingAttendance} />
                </Col>

                {/* List Cards Row */}
                <Col xs={24} lg={8}>
                    <UpcomingSessionsCard />
                </Col>
                <Col xs={24} lg={8}>
                    <RecentTransactionsCard />
                </Col>
                <Col xs={24} lg={8}>
                    <UpcomingBirthdaysCard metrics={metrics} />
                </Col>
            </Row>
        </div>
    );
};
