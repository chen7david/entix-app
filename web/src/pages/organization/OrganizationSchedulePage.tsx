import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Typography, Button, List, Tag, Result, Empty, Spin, Space, DatePicker, Select, Input, Card, Row, Col, Statistic } from "antd";
import { PlusOutlined, CalendarOutlined, TeamOutlined, SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { useSchedule, useScheduleMetrics } from "@web/src/hooks/useSchedule";
import { useDebounce } from "@web/src/hooks/useDebounce";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { SessionDetailsDrawer } from "@web/src/components/schedule/SessionDetailsDrawer";
import type { SessionSubmitPayload } from "@web/src/components/schedule/SessionDetailsDrawer";
import dayjs from "dayjs";
import { startOfToday, formatDistanceToNow } from "date-fns";
const { RangePicker } = DatePicker;

const { Title, Text } = Typography;

export const OrganizationSchedulePage = () => {
    const { activeOrganization } = useOrganization();
    
    const [searchParams, setSearchParams] = useSearchParams();

    const defaultStart = startOfToday().getTime();
    const defaultEnd = dayjs().endOf('day').valueOf();

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
    }, [startDateParam, endDateParam, searchParams, setSearchParams]);

    const [localSearch, setLocalSearch] = useState(searchParams.get('q') || '');
    const debouncedSearch = useDebounce(localSearch, 500);

    const [timeline, setTimeline] = useState('All');

    // Sync debounced search to URL cleanly without breaking histories naturally
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (debouncedSearch) params.set('q', debouncedSearch);
        else params.delete('q');
        setSearchParams(params, { replace: true });
    }, [debouncedSearch]);

    const { metrics } = useScheduleMetrics(activeOrganization?.id, queryStart, queryEnd);

    const { 
        sessions, 
        isLoading, 
        error, 
        createSession, 
        updateSession, 
        deleteSession,
        updateParticipantAttendance,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useSchedule(
        activeOrganization?.id,
        queryStart,
        queryEnd,
        debouncedSearch
    );

    let displaySessions = sessions || [];
    if (timeline === 'Upcoming') displaySessions = displaySessions.filter(s => s.startTime >= Date.now());
    if (timeline === 'Past') displaySessions = displaySessions.filter(s => s.startTime < Date.now());
    if (timeline === 'Next 5 Hours') displaySessions = displaySessions.filter(s => s.startTime >= Date.now() && s.startTime <= Date.now() + 5 * 3600000);
    if (timeline === 'Last 5 Hours') displaySessions = displaySessions.filter(s => s.startTime < Date.now() && s.startTime >= Date.now() - 5 * 3600000);

    const handleRangeChange = (dates: any) => {
        const params = new URLSearchParams(searchParams);
        if (dates && dates[0] && dates[1]) {
            params.set("startDate", dates[0].startOf('day').valueOf().toString());
            params.set("endDate", dates[1].endOf('day').valueOf().toString());
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
                    updateForward: payload.updateForward ?? false
                }
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
        return <Result status="error" title="Schedule Unavailable" subTitle="Failed to load organization schedule." />;
    }

    return (
        <>
            <Toolbar />
            <div className="p-6">
                <div className="flex justify-between items-end mb-6 w-full gap-4">
                    <div>
                        <Title level={2} style={{ marginBottom: 4 }}>Schedule</Title>
                        <Text type="secondary">Manage and track organization sessions</Text>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <Input
                            placeholder="Search sessions..."
                            prefix={<SearchOutlined />}
                            style={{ maxWidth: 200 }}
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            allowClear
                        />
                        <Select 
                            value={
                                (queryStart === dayjs().startOf('day').valueOf() && queryEnd === dayjs().endOf('day').valueOf()) ? 'Today' : 
                                (queryStart === dayjs().add(1, 'day').startOf('day').valueOf() && queryEnd === dayjs().add(1, 'day').endOf('day').valueOf()) ? 'Tomorrow' : 
                                (queryStart === dayjs().subtract(1, 'week').startOf('week').valueOf() && queryEnd === dayjs().subtract(1, 'week').endOf('week').valueOf()) ? 'Last Week' : 
                                (queryStart === dayjs().add(1, 'week').startOf('week').valueOf() && queryEnd === dayjs().add(1, 'week').endOf('week').valueOf()) ? 'Next Week' : 
                                (queryStart === dayjs().startOf('month').valueOf() && queryEnd === dayjs().endOf('month').valueOf()) ? 'This Month' : 
                                'Custom'
                            }
                            onChange={(val) => {
                                if (val === 'Today') handleRangeChange([dayjs().startOf('day'), dayjs().endOf('day')]);
                                else if (val === 'Tomorrow') handleRangeChange([dayjs().add(1, 'day').startOf('day'), dayjs().add(1, 'day').endOf('day')]);
                                else if (val === 'Last Week') handleRangeChange([dayjs().subtract(1, 'week').startOf('week'), dayjs().subtract(1, 'week').endOf('week')]);
                                else if (val === 'Next Week') handleRangeChange([dayjs().add(1, 'week').startOf('week'), dayjs().add(1, 'week').endOf('week')]);
                                else if (val === 'This Month') handleRangeChange([dayjs().startOf('month'), dayjs().endOf('month')]);
                            }}
                            style={{ minWidth: 130 }}
                            options={[
                                { label: 'Today', value: 'Today' },
                                { label: 'Tomorrow', value: 'Tomorrow' },
                                { label: 'Last Week', value: 'Last Week' },
                                { label: 'Next Week', value: 'Next Week' },
                                { label: 'This Month', value: 'This Month' },
                                { label: 'Custom', value: 'Custom', disabled: true }
                            ]}
                        />
                        <Select
                            value={timeline}
                            onChange={setTimeline}
                            style={{ minWidth: 120 }}
                            options={[
                                { label: 'All Time', value: 'All' },
                                { label: 'Upcoming', value: 'Upcoming' },
                                { label: 'Past', value: 'Past' },
                                { label: 'Next 5 Hours', value: 'Next 5 Hours' },
                                { label: 'Last 5 Hours', value: 'Last 5 Hours' }
                            ]}
                        />
                        <RangePicker 
                            onChange={handleRangeChange} 
                            value={[
                                queryStart ? dayjs(queryStart) : null, 
                                queryEnd ? dayjs(queryEnd) : null
                            ] as any}
                            allowClear={false}
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                            Schedule Session
                        </Button>
                    </div>
                </div>

                {/* Metrics Layer */}
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={8}>
                        <Card bordered={false} className="shadow-sm">
                            <Statistic
                                title="Total Sessions"
                                value={metrics?.total || 0}
                                prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card bordered={false} className="shadow-sm">
                            <Statistic
                                title="Completed"
                                value={metrics?.completed || 0}
                                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card bordered={false} className="shadow-sm">
                            <Statistic
                                title="Cancelled"
                                value={metrics?.cancelled || 0}
                                prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                            />
                        </Card>
                    </Col>
                </Row>

                    {isLoading && displaySessions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 50 }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <List
                            itemLayout="horizontal"
                            dataSource={displaySessions}
                            locale={{ emptyText: <Empty description="No upcoming sessions found matching criteria" /> }}
                            renderItem={(session) => (
                                <List.Item
                                    className="bg-white hover:bg-gray-50 transition-colors shadow-sm rounded-lg mb-4 cursor-pointer border border-gray-100! p-4!"
                                    onClick={() => handleEdit(session)}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <div style={{ 
                                                width: 60, height: 60, borderRadius: 8, 
                                                background: '#f0f2f5', display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center',
                                                border: '1px solid #d9d9d9'
                                            }}>
                                                <Text strong style={{ fontSize: 16, lineHeight: 1 }}>{dayjs(session.startTime).format("MMM")}</Text>
                                                <Title level={4} style={{ margin: 0, lineHeight: 1 }}>{dayjs(session.startTime).format("DD")}</Title>
                                            </div>
                                        }
                                        title={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Text strong style={{ fontSize: 16 }}>{session.title}</Text>
                                                {session.status === "completed" && <Tag color="green">Completed</Tag>}
                                                {session.status === "cancelled" && <Tag color="red">Cancelled</Tag>}
                                                {session.seriesId && <Tag color="blue" icon={<CalendarOutlined />}>Recurring</Tag>}
                                            </div>
                                        }
                                        description={
                                            <div>
                                                <div style={{ marginBottom: 4 }}>
                                                    <Text type="secondary">
                                                        {dayjs(session.startTime).format("h:mm A")} - {dayjs(session.startTime).add(session.durationMinutes, 'minute').format("h:mm A")} ({session.durationMinutes} min)
                                                    </Text>
                                                </div>
                                                <Space style={{ rowGap: 0, marginTop: 4 }}>
                                                    {session.participants && session.participants.length > 0 && (
                                                        <Tag icon={<TeamOutlined />}>
                                                            {session.participants.length} Member{session.participants.length > 1 ? 's' : ''}
                                                        </Tag>
                                                    )}
                                                    <Text type="secondary" italic style={{ marginLeft: 8 }}>
                                                        {formatDistanceToNow(session.startTime, { addSuffix: true })}
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
                onSaveAttendance={async (sessionId, participants) => {
                    await updateParticipantAttendance.mutateAsync({ sessionId, participants });
                }}
                onDelete={handleDelete}
            />
        </>
    );
};
