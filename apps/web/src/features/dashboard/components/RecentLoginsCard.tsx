import { UserOutlined } from "@ant-design/icons";
import { Empty, Typography } from "antd";
import type React from "react";
import { DashboardCard } from "./DashboardCard";

const { Text } = Typography;

/**
 * RecentLoginsCard - Shows recent activity/logins for the organization.
 *
 * TODO: Wire this to a dedicated /orgs/:id/analytics/recent-logins endpoint
 * once it is available on the backend.
 */
export const RecentLoginsCard: React.FC = () => {
    return (
        <DashboardCard
            titleText="Recent Activity"
            icon={<UserOutlined className="text-blue-500" />}
        >
            <div className="flex flex-col items-center justify-center py-8">
                <Empty
                    description={
                        <div className="text-center">
                            <Text type="secondary" strong className="block mb-1">
                                Activity Feed Coming Soon
                            </Text>
                            <Text type="secondary" className="text-xs">
                                Individual login events and session tracking will be visible here in
                                the next update.
                            </Text>
                        </div>
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </div>
        </DashboardCard>
    );
};
