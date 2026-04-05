import { CalendarOutlined, TeamOutlined } from "@ant-design/icons";
import { TableEmptyState } from "@web/src/components/data/TableEmptyState";
import { DateUtils } from "@web/src/utils/date";
import { Button, List, Tag, Typography, theme } from "antd";
import type React from "react";
import type { SessionDTO } from "../../hooks/useSchedule";

const { Title, Text } = Typography;

type Props = {
    sessions: SessionDTO[];
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    onFetchNextPage: () => void;
    onEdit: (session: SessionDTO) => void;
};

export const ScheduleSessionList: React.FC<Props> = ({
    sessions,
    hasNextPage,
    isFetchingNextPage,
    onFetchNextPage,
    onEdit,
}) => {
    const { token } = theme.useToken();

    return (
        <div className="flex flex-col h-full min-h-0">
            <List
                className="flex-1 min-h-0 overflow-auto"
                itemLayout="horizontal"
                dataSource={sessions}
                locale={{
                    emptyText: (
                        <TableEmptyState
                            icon={<CalendarOutlined style={{ fontSize: 64 }} />}
                            title="No upcoming sessions found matching criteria"
                            subtitle="Try adjusting your filters or checking a different date range."
                        />
                    ),
                }}
                renderItem={(session) => (
                    <List.Item
                        className="transition-colors shadow-sm rounded-lg mb-4 cursor-pointer p-0!"
                        style={{
                            backgroundColor: token.colorBgContainer,
                            border: `1px solid ${token.colorBorderSecondary}`,
                            overflow: "hidden",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = token.colorFillAlter;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = token.colorBgContainer;
                        }}
                        onClick={() => onEdit(session)}
                    >
                        <div className="p-4 w-full flex items-center">
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
                                    marginRight: 16,
                                }}
                            >
                                <Text strong style={{ fontSize: 13, lineHeight: 1 }}>
                                    {DateUtils.format(session.startTime, "MMM").toUpperCase()}
                                </Text>
                                <Title level={4} style={{ margin: 0, lineHeight: 1.2 }}>
                                    {DateUtils.format(session.startTime, "DD")}
                                </Title>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                                <div className="flex items-center gap-4 flex-wrap">
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        {DateUtils.format(session.startTime, "h:mm A")} -{" "}
                                        {DateUtils.format(
                                            DateUtils.addMinutes(
                                                session.startTime,
                                                session.durationMinutes
                                            ),
                                            "h:mm A"
                                        )}{" "}
                                        ({session.durationMinutes} min)
                                    </Text>
                                    {session.attendances && session.attendances.length > 0 && (
                                        <Tag icon={<TeamOutlined />} style={{ margin: 0 }}>
                                            {session.attendances.length} Member
                                            {session.attendances.length > 1 ? "s" : ""}
                                        </Tag>
                                    )}
                                    <Text type="secondary" italic style={{ fontSize: 12 }}>
                                        {DateUtils.fromNow(session.startTime)}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    </List.Item>
                )}
            />

            {hasNextPage && (
                <div className="flex justify-center mt-6 py-4">
                    <Button
                        onClick={() => onFetchNextPage()}
                        loading={isFetchingNextPage}
                        type="dashed"
                        size="large"
                    >
                        Load More Sessions
                    </Button>
                </div>
            )}
        </div>
    );
};
