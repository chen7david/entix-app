import { CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useOrganization, useOrgNavigate } from "@web/src/features/organization";
import { useSchedule } from "@web/src/features/schedule/hooks/useSchedule";
import { DateUtils } from "@web/src/utils/date";
import { Badge, Button, Card, List, Space, Typography } from "antd";
import type React from "react";
import { useMemo } from "react";

const { Text } = Typography;

export const UpcomingSessionsCard: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const navigateOrg = useOrgNavigate();

    const startDate = useMemo(() => DateUtils.startOf("day"), []);
    const { sessions, isLoading } = useSchedule(activeOrganization?.id, startDate);

    const nextSessions = (sessions || []).slice(0, 5);

    return (
        <Card
            title={
                <span>
                    <CalendarOutlined className="mr-2 text-blue-500" /> Upcoming Sessions
                </span>
            }
            className="shadow-sm h-full"
            styles={{ body: { padding: "12px 20px" } }}
            extra={
                <Button
                    type="link"
                    size="small"
                    className="p-0 text-xs"
                    onClick={() => navigateOrg(AppRoutes.org.admin.schedule)}
                >
                    View All
                </Button>
            }
        >
            <List
                loading={isLoading}
                dataSource={nextSessions}
                renderItem={(item) => (
                    <List.Item className="px-0 py-3 border-b last:border-0 border-slate-50">
                        <List.Item.Meta
                            title={
                                <div className="flex justify-between items-center w-full">
                                    <Text strong className="block truncate max-w-[140px]">
                                        {item.title}
                                    </Text>
                                    <Badge
                                        status={
                                            item.status === "scheduled" ? "processing" : "default"
                                        }
                                        text={
                                            <Text
                                                type="secondary"
                                                className="text-[10px] capitalize"
                                            >
                                                {item.status}
                                            </Text>
                                        }
                                    />
                                </div>
                            }
                            description={
                                <Space size={6} className="text-slate-500">
                                    <ClockCircleOutlined className="text-xs" />
                                    <Text type="secondary" className="text-xs">
                                        {DateUtils.format(item.startTime, "MMM D, h:mm A")}
                                    </Text>
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
        </Card>
    );
};
