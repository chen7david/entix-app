import { PlusOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { PageHeader } from "@web/src/components/layout/PageHeader";
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
import { useLocation } from "react-router";

export const OrganizationSchedulePage: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const location = useLocation();

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

    const getSessionMeetingHref = (session: { id: string; title: string }) => {
        if (!activeOrganization?.slug) return undefined;
        const params = new URLSearchParams({
            title: session.title,
            returnTo: `${location.pathname}${location.search}`,
        });
        return `/org/${activeOrganization.slug}${AppRoutes.org.meeting(session.id)}?${params.toString()}`;
    };

    const openSessionVideo = (session: { id: string; title: string }) => {
        const href = getSessionMeetingHref(session);
        if (!href) return;
        window.open(href, "_blank", "noopener,noreferrer");
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
        <div className="flex flex-col h-full">
            <PageHeader
                title="Schedule"
                subtitle="Manage and track organization sessions."
                actions={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                        size="large"
                        className="h-11 font-semibold transition-all duration-200"
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
                        onJoinSessionVideo={openSessionVideo}
                        getSessionVideoHref={getSessionMeetingHref}
                        joinMeetingPending={false}
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
                onJoinVideo={
                    selectedSession ? () => void openSessionVideo(selectedSession) : undefined
                }
                joinMeetingPending={false}
            />
        </div>
    );
};
