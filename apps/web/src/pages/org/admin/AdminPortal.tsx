import { CalendarOutlined, TeamOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { FilterBar, type FilterConfig } from "@web/src/components/data/FilterBar";
import {
    type DatePresetOption,
    getRangeFromPreset,
} from "@web/src/components/data/filter-bar/datePresetAdapter";
import { DataFreshnessControls } from "@web/src/components/data/refresh/DataFreshnessControls";
import { useDataFreshnessControls } from "@web/src/components/data/refresh/useDataFreshnessControls";
import { useAnalytics } from "@web/src/features/analytics";
import {
    DashboardMetricCards,
    MemberSetupIssuesPanel,
    RecentTransactionsCard,
    UpcomingBirthdaysCard,
    UpcomingSessionsCard,
} from "@web/src/features/dashboard";
import { useBillingPlans } from "@web/src/features/finance/hooks/useBillingPlans";
import { useBulkMembers, useOrganization } from "@web/src/features/organization";
import { useOrgNavigate } from "@web/src/features/organization/hooks/useOrgNavigate";
import { DateUtils } from "@web/src/utils/date";
import { Alert, Button, Col, Row, Space, Spin, Typography, theme } from "antd";
import { lazy, Suspense, useCallback, useMemo, useState } from "react";

const SessionVolumeChart = lazy(() =>
    import("@web/src/features/analytics").then((m) => ({ default: m.SessionVolumeChart }))
);
const AttendanceTrendChart = lazy(() =>
    import("@web/src/features/analytics").then((m) => ({ default: m.AttendanceTrendChart }))
);

const { Title, Text } = Typography;

export const AdminPortal: React.FC = () => {
    const { token } = theme.useToken();
    const { activeOrganization } = useOrganization();
    const navigateOrg = useOrgNavigate();
    const { metrics, isLoadingMetrics, isFetchingMetrics, metricsUpdatedAt, refetchMetrics } =
        useBulkMembers(activeOrganization?.id);
    const { data: billingPlansResult, isLoading: isBillingPlansLoading } = useBillingPlans(
        activeOrganization?.id ?? "",
        {
            limit: 50,
        }
    );
    const hasActiveBillingPlan = (billingPlansResult?.data ?? []).some((plan) => plan.isActive);

    // Dashboard defaults to "This Month" preset
    const [range, setRange] = useState<{ start: number; end: number; label: string }>({
        start: DateUtils.startOf("month"),
        end: DateUtils.endOf("month"),
        label: "This Month",
    });

    const {
        sessionTrends,
        isLoadingSessions,
        isFetchingSessions,
        sessionsUpdatedAt,
        refetchSessions,
        attendanceTrends,
        isLoadingAttendance,
        isFetchingAttendance,
        attendanceUpdatedAt,
        refetchAttendance,
    } = useAnalytics(activeOrganization?.id, range.start, range.end);

    const handleRefresh = useCallback(() => {
        void Promise.all([refetchMetrics(), refetchSessions(), refetchAttendance()]);
    }, [refetchAttendance, refetchMetrics, refetchSessions]);

    const lastFetchedAt = useMemo(() => {
        const values = [metricsUpdatedAt, sessionsUpdatedAt, attendanceUpdatedAt].filter(
            (value): value is number => Boolean(value)
        );
        return values.length > 0 ? Math.max(...values) : undefined;
    }, [attendanceUpdatedAt, metricsUpdatedAt, sessionsUpdatedAt]);

    const freshnessControls = useDataFreshnessControls({
        lastFetchedAt,
        isFetching: isFetchingMetrics || isFetchingSessions || isFetchingAttendance,
        onRefresh: handleRefresh,
    });

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
            <Row
                justify="space-between"
                align="bottom"
                style={{ marginBottom: 32 }}
                gutter={[16, 16]}
            >
                <Col>
                    <Text
                        className="uppercase tracking-[0.14em] text-xs font-semibold"
                        style={{ color: token.colorPrimary }}
                    >
                        Operations
                    </Text>
                    <Title level={2} className="!mt-2 !mb-1 font-display">
                        {activeOrganization?.name || "Organization"}
                    </Title>
                    <Text type="secondary">
                        Create sessions, manage people, and monitor school health.
                    </Text>
                </Col>
                <Col>
                    <Space wrap>
                        <Button
                            type="primary"
                            icon={<CalendarOutlined />}
                            onClick={() => navigateOrg(AppRoutes.org.teaching.sessions)}
                        >
                            Sessions
                        </Button>
                        <Button
                            icon={<TeamOutlined />}
                            onClick={() => navigateOrg(AppRoutes.org.admin.members)}
                        >
                            People
                        </Button>
                    </Space>
                </Col>
            </Row>

            <div className="mb-4">
                <DataFreshnessControls
                    freshnessLabel={freshnessControls.freshness.label}
                    freshnessTooltip={freshnessControls.freshness.tooltip}
                    status={freshnessControls.freshness.status}
                    isRefreshing={freshnessControls.isFetching}
                    onRefresh={freshnessControls.refreshNow}
                />
            </div>
            {!isBillingPlansLoading && !hasActiveBillingPlan && (
                <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 24 }}
                    message="No active billing plan configured"
                    description={
                        <>
                            Students cannot be billed until at least one active billing plan exists.{" "}
                            <Button
                                type="link"
                                className="p-0 h-auto align-baseline"
                                onClick={() => navigateOrg(AppRoutes.org.admin.billing.plans)}
                            >
                                Create billing plan
                            </Button>
                            .
                        </>
                    }
                />
            )}
            <div style={{ marginTop: 8 }}>
                <DashboardMetricCards metrics={metrics} loading={isLoadingMetrics} />
            </div>
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
                    <Suspense fallback={<Spin className="flex justify-center p-8" />}>
                        <SessionVolumeChart data={sessionTrends} isLoading={isLoadingSessions} />
                    </Suspense>
                </Col>
                <Col xs={24} lg={12}>
                    <Suspense fallback={<Spin className="flex justify-center p-8" />}>
                        <AttendanceTrendChart
                            data={attendanceTrends}
                            isLoading={isLoadingAttendance}
                        />
                    </Suspense>
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
                <MemberSetupIssuesPanel paymentReadiness={metrics?.paymentReadiness} />
            </div>
        </div>
    );
};
