import { UserOutlined } from "@ant-design/icons";
import { Card, Empty, Typography } from "antd";
import type React from "react";

const { Text } = Typography;

/**
 * RecentLoginsCard - Shows recent activity/logins for the organization.
 *
 * TODO: Wire this to a dedicated /orgs/:id/analytics/recent-logins endpoint
 * once it is available on the backend.
 */
export const RecentLoginsCard: React.FC = () => {
    return (
        <Card
            title={
                <span>
                    <UserOutlined className="mr-2 text-blue-500" /> Recent Activity
                </span>
            }
            className="shadow-sm h-full"
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
        </Card>
    );
};
