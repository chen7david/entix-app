import { PlusOutlined } from "@ant-design/icons";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import { useOrganization } from "@web/src/features/organization";
import {
    ScheduleFilterBar,
    ScheduleMetricsGrid,
    ScheduleSessionList,
    SessionDetailsDrawer,
    useScheduleState,
} from "@web/src/features/schedule";
import { Button, Result, Spin } from "antd";
import type React from "react";
import { useNavigate, useParams } from "react-router";

export const OrganizationSchedulePage: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const navigate = useNavigate();
    const { slug } = useParams<{ slug: string }>();

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
        handleReset,
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
        <PageShell>
            <PageHeader
                title="Schedule"
                subtitle="Manage and track organization sessions."
                actions={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                        size="large"
                    >
                        Schedule Session
                    </Button>
                }
            />

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
                onReset={handleReset}
            />

            <div className="flex-1 min-h-0 flex flex-col">
                {isLoading && displaySessions.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <Spin size="large" />
                    </div>
                ) : (
                    <ScheduleSessionList
                        sessions={displaySessions}
                        hasNextPage={hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        onFetchNextPage={fetchNextPage}
                        onEdit={handleEdit}
                        onCreate={handleCreate}
                        onOpenVocabulary={(session) => {
                            if (!slug) return;
                            navigate(`/org/${slug}/teaching/sessions/${session.id}/vocabulary`);
                        }}
                    />
                )}
            </div>

            <SessionDetailsDrawer
                open={drawerOpen}
                onClose={handleCloseDrawer}
                session={selectedSession}
                onSave={handleSave}
                onUpdateStatus={handleUpdateStatus}
                onSaveAttendance={handleSaveAttendance}
                onDelete={handleDelete}
            />
        </PageShell>
    );
};
