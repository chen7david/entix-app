import { CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useOrganization, useOrgNavigate } from "@web/src/features/organization";
import { useSchedule } from "@web/src/features/schedule/hooks/useSchedule";
import { DateUtils } from "@web/src/utils/date";
import { List, Space, Tooltip, Typography } from "antd";
import type React from "react";
import { useMemo } from "react";
import { DashboardCard } from "./DashboardCard";

const { Text } = Typography;

export const UpcomingSessionsCard: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const navigateOrg = useOrgNavigate();

    const startDate = useMemo(() => DateUtils.startOf("day"), []);
    const { sessions, isLoading } = useSchedule(activeOrganization?.id, startDate);

    const nextSessions = useMemo(() => {
        return [...(sessions || [])].sort((a, b) => a.startTime - b.startTime).slice(0, 5);
    }, [sessions]);

    return (
        <DashboardCard
            titleText="Upcoming Sessions"
            icon={<CalendarOutlined className="text-blue-500" />}
            onViewAll={() => navigateOrg(AppRoutes.org.admin.schedule)}
        >
            <List
                loading={isLoading}
                dataSource={nextSessions}
                renderItem={(item) => (
                    <List.Item className="px-0 py-3">
                        <List.Item.Meta
                            title={
                                <div className="flex justify-between items-center w-full">
                                    <Text strong className="block truncate max-w-[140px]">
                                        {item.title}
                                    </Text>
                                </div>
                            }
                            description={
                                <Space size={6} className="text-slate-500">
                                    <ClockCircleOutlined className="text-xs" />
                                    <Tooltip
                                        title={DateUtils.format(item.startTime, "MMM D, h:mm A")}
                                    >
                                        <Text type="secondary" className="text-xs cursor-default">
                                            {DateUtils.fromNow(item.startTime)}
                                        </Text>
                                    </Tooltip>
                                    <span className="text-slate-300">·</span>
                                    <Text type="secondary" className="text-xs">
                                        {item.durationMinutes}m
                                    </Text>
                                </Space>
                            }
                        />
                    </List.Item>
                )}
                locale={{
                    emptyText: (
                        <Text type="secondary" italic>
                            No upcoming sessions
                        </Text>
                    ),
                }}
            />
        </DashboardCard>
    );
};
