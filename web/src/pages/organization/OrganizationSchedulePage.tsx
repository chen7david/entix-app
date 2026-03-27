import {
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    PlusOutlined,
    SearchOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import type { SessionSubmitPayload } from "@web/src/components/schedule/SessionDetailsDrawer";
import { SessionDetailsDrawer } from "@web/src/components/schedule/SessionDetailsDrawer";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { useSchedule, useScheduleMetrics } from "@web/src/hooks/useSchedule";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import { DateUtils } from "@web/src/utils/date";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Empty,
    Input,
    List,
    Result,
    Row,
    Select,
    Space,
    Spin,
    Statistic,
    Tag,
    Typography,
    theme,
} from "antd";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

const { RangePicker } = DatePicker;

const { Title, Text } = Typography;

export const OrganizationSchedulePage = () => {
    const { activeOrganization } = useOrganization();
    const { token } = theme.useToken();

    const [searchParams, setSearchParams] = useSearchParams();

    const defaultStart = DateUtils.startOf("day");
    const defaultEnd = DateUtils.endOf("day");

    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Revert natively to UI defaults if no strictly valid chronologic tokens are mapped from URL
    const queryStart = startDateParam ? parseInt(startDateParam, 10) : defaultStart;
    const queryEnd = endDateParam ? parseInt(endDateParam, 10) : defaultEnd;

    // Force strict "Today" bounds routing URL syncing visually naturally
    useEffect(() => {
        if (!startDateParam || !endDateParam) {
            const params = new URLSearchParams(searchParams);
            params.set("startDate", queryStart.toString());
            params.set("endDate", queryEnd.toString());
            setSearchParams(params, { replace: true });
        }
    }, [
        startDateParam,
        endDateParam,
        searchParams,
        setSearchParams,
        queryEnd.toString,
        queryStart.toString,
    ]);

    const [localSearch, setLocalSearch] = useState(searchParams.get("q") || "");
    const [debouncedSearch, control] = useDebouncedValue(
        localSearch,
        { wait: UI_CONSTANTS.DEBOUNCE.SEARCH_TABLE },
        (state) => ({ isPending: state.isPending })
    );

    const [timeline, setTimeline] = useState("All");

    // Sync debounced search to URL cleanly without breaking histories naturally
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (debouncedSearch) params.set("q", debouncedSearch);
        else params.delete("q");
        setSearchParams(params, { replace: true });
    }, [debouncedSearch, searchParams, setSearchParams]);

    const { metrics } = useScheduleMetrics(activeOrganization?.id, queryStart, queryEnd);

    const {
        sessions,
        isLoading,
        error,
        createSession,
        updateSession,
        updateSessionStatus,
        deleteSession,
        updateAttendance,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useSchedule(activeOrganization?.id, queryStart, queryEnd, debouncedSearch);

    let displaySessions = sessions || [];
    if (timeline === "Upcoming")
        displaySessions = displaySessions.filter((s) => s.startTime >= Date.now());
    if (timeline === "Past")
        displaySessions = displaySessions.filter((s) => s.startTime < Date.now());
    if (timeline === "Next 5 Hours")
        displaySessions = displaySessions.filter(
            (s) => s.startTime >= Date.now() && s.startTime <= Date.now() + 5 * 3600000
        );
    if (timeline === "Last 5 Hours")
        displaySessions = displaySessions.filter(
            (s) => s.startTime < Date.now() && s.startTime >= Date.now() - 5 * 3600000
        );

    const handleRangeChange = (dates: any) => {
        const params = new URLSearchParams(searchParams);
        if (dates?.[0] && dates[1]) {
            params.set("startDate", DateUtils.startOf("day", dates[0]).toString());
            params.set("endDate", DateUtils.endOf("day", dates[1]).toString());
        } else {
            params.delete("startDate");
            params.delete("endDate");
        }
        setSearchParams(params, { replace: true });
    };

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<any>(null);

    const handleCreate = () => {
        setSelectedSession(null);
        setDrawerOpen(true);
    };

    const handleEdit = (session: any) => {
        setSelectedSession(session);
        setDrawerOpen(true);
    };

    const handleSave = async (payload: SessionSubmitPayload) => {
        if (selectedSession) {
            await updateSession.mutateAsync({
                sessionId: selectedSession.id,
                payload: {
                    ...payload,
                    updateForward: payload.updateForward ?? false,
                },
            });
        } else {
            await createSession.mutateAsync(payload);
        }
        setDrawerOpen(false);
    };

    const handleDelete = async (sessionId: string, deleteForward: boolean) => {
        await deleteSession.mutateAsync({ sessionId, deleteForward });
        setDrawerOpen(false);
    };

    if (error) {
        return (
            <Result
                status="error"
                title="Schedule Unavailable"
                subTitle="Failed to load organization schedule."
            />
        );
    }

    return (
        <>
            <Toolbar />
            <div className="p-6">
                <div className="flex justify-between items-end mb-6 w-full gap-4">
                    <div>
                        <Title level={2} style={{ marginBottom: 4 }}>
                            Schedule
                        </Title>
                        <Text type="secondary">Manage and track organization sessions</Text>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                            Schedule Session
                        </Button>
                    </div>
                </div>

                {/* Metrics Layer */}
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={8}>
                        <Card variant="borderless" className="shadow-sm">
                            <Statistic
                                title="Total Sessions"
                                value={metrics?.total || 0}
                                prefix={<ClockCircleOutlined style={{ color: "#1890ff" }} />}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card variant="borderless" className="shadow-sm">
                            <Statistic
                                title="Completed"
                                value={metrics?.completed || 0}
                                prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card variant="borderless" className="shadow-sm">
                            <Statistic
                                title="Cancelled"
                                value={metrics?.cancelled || 0}
                                prefix={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
                            />
                        </Card>
                    </Col>
                </Row>

                <div className="flex items-center gap-4 flex-wrap mb-6">
                    <Input
                        placeholder="Search sessions..."
                        prefix={<SearchOutlined />}
                        style={{ maxWidth: 200 }}
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        allowClear
                        suffix={
                            control.state.isPending ? (
                                <span className="text-xs text-gray-400 italic">typing...</span>
                            ) : null
                        }
                    />
                    <Select
                        value={
                            queryStart === DateUtils.startOf("day") &&
                            queryEnd === DateUtils.endOf("day")
                                ? "Today"
                                : queryStart === DateUtils.offsetStartOf(1, "day", "day") &&
                                    queryEnd === DateUtils.offsetEndOf(1, "day", "day")
                                  ? "Tomorrow"
                                  : queryStart === DateUtils.offsetStartOf(-1, "week", "week") &&
                                      queryEnd === DateUtils.offsetEndOf(-1, "week", "week")
                                    ? "Last Week"
                                    : queryStart === DateUtils.offsetStartOf(1, "week", "week") &&
                                        queryEnd === DateUtils.offsetEndOf(1, "week", "week")
                                      ? "Next Week"
                                      : queryStart === DateUtils.startOf("month") &&
                                          queryEnd === DateUtils.endOf("month")
                                        ? "This Month"
                                        : null
                        }
                        placeholder="Custom Range"
                        onChange={(val) => {
                            if (val === "Today")
                                handleRangeChange([
                                    DateUtils.toLibDate(DateUtils.startOf("day")),
                                    DateUtils.toLibDate(DateUtils.endOf("day")),
                                ]);
                            else if (val === "Tomorrow")
                                handleRangeChange([
                                    DateUtils.toLibDate(DateUtils.offsetStartOf(1, "day", "day")),
                                    DateUtils.toLibDate(DateUtils.offsetEndOf(1, "day", "day")),
                                ]);
                            else if (val === "Last Week")
                                handleRangeChange([
                                    DateUtils.toLibDate(
                                        DateUtils.offsetStartOf(-1, "week", "week")
                                    ),
                                    DateUtils.toLibDate(DateUtils.offsetEndOf(-1, "week", "week")),
                                ]);
                            else if (val === "Next Week")
                                handleRangeChange([
                                    DateUtils.toLibDate(DateUtils.offsetStartOf(1, "week", "week")),
                                    DateUtils.toLibDate(DateUtils.offsetEndOf(1, "week", "week")),
                                ]);
                            else if (val === "This Month")
                                handleRangeChange([
                                    DateUtils.toLibDate(DateUtils.startOf("month")),
                                    DateUtils.toLibDate(DateUtils.endOf("month")),
                                ]);
                        }}
                        style={{ minWidth: 130 }}
                        options={[
                            { label: "Today", value: "Today" },
                            { label: "Tomorrow", value: "Tomorrow" },
                            { label: "Last Week", value: "Last Week" },
                            { label: "Next Week", value: "Next Week" },
                            { label: "This Month", value: "This Month" },
                        ]}
                    />
                    <Select
                        value={timeline}
                        onChange={setTimeline}
                        style={{ minWidth: 120 }}
                        options={[
                            { label: "All Time", value: "All" },
                            { label: "Upcoming", value: "Upcoming" },
                            { label: "Past", value: "Past" },
                            { label: "Next 5 Hours", value: "Next 5 Hours" },
                            { label: "Last 5 Hours", value: "Last 5 Hours" },
                        ]}
                    />
                    <RangePicker
                        onChange={handleRangeChange}
                        value={
                            [
                                queryStart ? DateUtils.toLibDate(queryStart) : null,
                                queryEnd ? DateUtils.toLibDate(queryEnd) : null,
                            ] as any
                        }
                        allowClear={false}
                    />
                </div>

                {isLoading && displaySessions.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 50 }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={displaySessions}
                        locale={{
                            emptyText: (
                                <Empty description="No upcoming sessions found matching criteria" />
                            ),
                        }}
                        renderItem={(session) => (
                            <List.Item
                                className="transition-colors shadow-sm rounded-lg mb-4 cursor-pointer p-4!"
                                style={{
                                    backgroundColor: token.colorBgContainer,
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = token.colorFillAlter;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = token.colorBgContainer;
                                }}
                                onClick={() => handleEdit(session)}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <div
                                            style={{
                                                width: 60,
                                                height: 60,
                                                borderRadius: 8,
                                                background: token.colorFillQuaternary,
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                border: `1px solid ${token.colorBorderSecondary}`,
                                            }}
                                        >
                                            <Text strong style={{ fontSize: 16, lineHeight: 1 }}>
                                                {DateUtils.format(session.startTime, "MMM")}
                                            </Text>
                                            <Title level={4} style={{ margin: 0, lineHeight: 1 }}>
                                                {DateUtils.format(session.startTime, "DD")}
                                            </Title>
                                        </div>
                                    }
                                    title={
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <Text strong style={{ fontSize: 16 }}>
                                                {session.title}
                                            </Text>
                                            {session.status === "completed" && (
                                                <Tag color="green">Completed</Tag>
                                            )}
                                            {session.status === "cancelled" && (
                                                <Tag color="red">Cancelled</Tag>
                                            )}
                                            {session.seriesId && (
                                                <Tag color="blue" icon={<CalendarOutlined />}>
                                                    Recurring
                                                </Tag>
                                            )}
                                        </div>
                                    }
                                    description={
                                        <div>
                                            <div style={{ marginBottom: 4 }}>
                                                <Text type="secondary">
                                                    {DateUtils.format(session.startTime, "h:mm A")}{" "}
                                                    -{" "}
                                                    {DateUtils.format(
                                                        DateUtils.addMinutes(
                                                            session.startTime,
                                                            session.durationMinutes
                                                        ),
                                                        "h:mm A"
                                                    )}{" "}
                                                    ({session.durationMinutes} min)
                                                </Text>
                                            </div>
                                            <Space style={{ rowGap: 0, marginTop: 4 }}>
                                                {session.attendances &&
                                                    session.attendances.length > 0 && (
                                                        <Tag icon={<TeamOutlined />}>
                                                            {session.attendances.length} Member
                                                            {session.attendances.length > 1
                                                                ? "s"
                                                                : ""}
                                                        </Tag>
                                                    )}
                                                <Text
                                                    type="secondary"
                                                    italic
                                                    style={{ marginLeft: 8 }}
                                                >
                                                    {DateUtils.fromNow(session.startTime)}
                                                </Text>
                                            </Space>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}

                {hasNextPage && (
                    <div className="flex justify-center mt-6">
                        <Button
                            onClick={() => fetchNextPage()}
                            loading={isFetchingNextPage}
                            type="dashed"
                        >
                            Load More Sessions
                        </Button>
                    </div>
                )}
            </div>

            <SessionDetailsDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                session={selectedSession}
                onSave={handleSave}
                onUpdateStatus={async (sessionId, status) => {
                    await updateSessionStatus.mutateAsync({
                        sessionId,
                        payload: { status },
                    });
                }}
                onSaveAttendance={async (sessionId, attendances) => {
                    await updateAttendance.mutateAsync({ sessionId, attendances });
                }}
                onDelete={handleDelete}
            />
        </>
    );
};
