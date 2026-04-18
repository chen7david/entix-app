import { GiftOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import type { BulkMetrics } from "@web/src/features/organization";
import { useOrgNavigate } from "@web/src/features/organization";
import { DateUtils } from "@web/src/utils/date";
import { List, Tag, Typography } from "antd";
import type React from "react";
import { DashboardCard } from "./DashboardCard";

const { Text } = Typography;

interface UpcomingBirthdaysCardProps {
    metrics?: BulkMetrics;
}

export const UpcomingBirthdaysCard: React.FC<UpcomingBirthdaysCardProps> = ({ metrics }) => {
    const navigateOrg = useOrgNavigate();

    const totalBirthdays = metrics?.upcomingBirthdays?.length ?? 0;

    return (
        <DashboardCard
            titleText={`Upcoming Birthdays${totalBirthdays > 0 ? ` (${totalBirthdays})` : ""}`}
            icon={<GiftOutlined className="text-rose-500" />}
            onViewAll={() => navigateOrg(AppRoutes.org.admin.members)}
        >
            <div className="overflow-y-auto max-h-[340px] pr-2">
                <List<BulkMetrics["upcomingBirthdays"][number]>
                    dataSource={metrics?.upcomingBirthdays ?? []}
                    renderItem={(b) => (
                        <List.Item className="px-0 py-3">
                            <List.Item.Meta
                                title={
                                    <div className="flex justify-between items-center w-full">
                                        <Text strong className="text-sm truncate">
                                            {b.name}
                                        </Text>
                                        <div>
                                            {b.daysUntil === 0 ? (
                                                <Tag
                                                    className="m-0"
                                                    color="red"
                                                    icon={<GiftOutlined />}
                                                >
                                                    Today! 🎉
                                                </Tag>
                                            ) : b.daysUntil === 1 ? (
                                                <Tag className="m-0" color="orange">
                                                    Tomorrow
                                                </Tag>
                                            ) : b.daysUntil <= 3 ? (
                                                <Tag className="m-0" color="orange">
                                                    {b.daysUntil} days
                                                </Tag>
                                            ) : (
                                                <Tag className="m-0" color="default">
                                                    in {b.daysUntil} days
                                                </Tag>
                                            )}
                                        </div>
                                    </div>
                                }
                                description={
                                    <Text type="secondary" className="text-xs">
                                        {DateUtils.format(b.birthDate, "MMMM D")}
                                    </Text>
                                }
                            />
                        </List.Item>
                    )}
                    locale={{
                        emptyText: (
                            <Text type="secondary" italic>
                                No birthdays in the next 30 days.
                            </Text>
                        ),
                    }}
                />
            </div>
        </DashboardCard>
    );
};
