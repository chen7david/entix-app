import { FilterBar, type FilterConfig } from "@web/src/components/data/FilterBar";
import {
    type DatePresetOption,
    getRangeFromPreset,
} from "@web/src/components/data/filter-bar/datePresetAdapter";
import {
    AttendanceTrendChart,
    SessionVolumeChart,
    useAnalytics,
} from "@web/src/features/analytics";
import {
    DashboardMetricCards,
    PaymentReadinessPanel,
    RecentTransactionsCard,
    UpcomingBirthdaysCard,
    UpcomingSessionsCard,
} from "@web/src/features/dashboard";
import { useBulkMembers, useOrganization } from "@web/src/features/organization";
import { DateUtils } from "@web/src/utils/date";
import { Col, Row, Typography } from "antd";
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

    const dashboardPresetOptions: DatePresetOption[] = [
        {
            label: "Last 7 Days",
            start: DateUtils.offsetStartOf(-7, "day", "day"),
            end: DateUtils.endOf("day"),
        },
        {
            label: "Last 30 Days",
            start: DateUtils.offsetStartOf(-30, "day", "day"),
            end: DateUtils.endOf("day"),
        },
        {
            label: "This Month",
            start: DateUtils.startOf("month"),
            end: DateUtils.endOf("month"),
        },
        {
            label: "This Year",
            start: DateUtils.startOf("year"),
            end: DateUtils.endOf("year"),
        },
    ];

    const handlePresetChange = (label: string) => {
        const preset = getRangeFromPreset(dashboardPresetOptions, label);
        if (!preset) {
            const fallback = getRangeFromPreset(dashboardPresetOptions, "This Month");
            if (!fallback) return;
            setRange({ start: fallback.start, end: fallback.end, label: "This Month" });
            return;
        }
        setRange({ start: preset.start, end: preset.end, label });
    };

    const dashboardFilters: FilterConfig[] = [
        {
            type: "select",
            key: "preset",
            minWidth: 160,
            options: dashboardPresetOptions.map((preset) => ({
                label: preset.label,
                value: preset.label,
            })),
            allowClear: false,
        },
    ];

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
            </Row>

            <DashboardMetricCards metrics={metrics} loading={isLoadingMetrics} />
            <FilterBar
                filters={dashboardFilters}
                values={{ preset: range.label }}
                initialValues={{ preset: "This Month" }}
                onChange={(next) => handlePresetChange(next.preset as string)}
                onReset={() => handlePresetChange("This Month")}
                showReset
            />

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

            <div className="mt-6">
                <PaymentReadinessPanel paymentReadiness={metrics?.paymentReadiness} />
            </div>
        </div>
    );
};
