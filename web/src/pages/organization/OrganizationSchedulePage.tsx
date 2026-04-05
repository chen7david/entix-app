import { PlusOutlined } from "@ant-design/icons";
import { useOrganization } from "@web/src/features/organization";
import {
    ScheduleFilterBar,
    ScheduleMetricsGrid,
    ScheduleSessionList,
    SessionDetailsDrawer,
    useScheduleState,
} from "@web/src/features/schedule";
import { Button, Flex, Grid, Result, Spin, Typography } from "antd";
import type React from "react";

const { Title, Text } = Typography;

export const OrganizationSchedulePage: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const screens = Grid.useBreakpoint();

    const {
        // State
        queryStart,
        queryEnd,
        localSearch,
        setLocalSearch,
        searchControl,
        timeline,
        setTimeline,
        drawerOpen,
        selectedSession,

        // Data
        metrics,
        displaySessions,
        isLoading,
        error,
        hasNextPage,
        isFetchingNextPage,

        // Handlers
        handleRangeChange,
        handleCreate,
        handleEdit,
        handleCloseDrawer,
        handleSave,
        handleDelete,
        handleUpdateStatus,
        handleSaveAttendance,
        fetchNextPage,
    } = useScheduleState(activeOrganization?.id);

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
        <div>
            <Flex
                vertical={!screens.md}
                justify="space-between"
                align={screens.md ? "center" : "start"}
                gap={16}
                style={{ marginBottom: 32 }}
            >
                <div style={{ flex: 1 }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Schedule
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Manage and track organization sessions.
                    </Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
                    Schedule Session
                </Button>
            </Flex>

            <ScheduleMetricsGrid metrics={metrics} loading={isLoading} />

            <ScheduleFilterBar
                search={localSearch}
                onSearchChange={setLocalSearch}
                isSearching={searchControl.state.isPending}
                startDate={queryStart}
                endDate={queryEnd}
                onRangeChange={handleRangeChange}
                timeline={timeline}
                onTimelineChange={setTimeline}
            />

            {isLoading && displaySessions.length === 0 ? (
                <div style={{ textAlign: "center", padding: 50 }}>
                    <Spin size="large" />
                </div>
            ) : (
                <ScheduleSessionList
                    sessions={displaySessions}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    onFetchNextPage={fetchNextPage}
                    onEdit={handleEdit}
                />
            )}

            <SessionDetailsDrawer
                open={drawerOpen}
                onClose={handleCloseDrawer}
                session={selectedSession}
                onSave={handleSave}
                onUpdateStatus={handleUpdateStatus}
                onSaveAttendance={handleSaveAttendance}
                onDelete={handleDelete}
            />
        </div>
    );
};
