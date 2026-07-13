import { SafetyOutlined, StopOutlined, TeamOutlined } from "@ant-design/icons";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import { useAdminUsers } from "@web/src/features/admin";
import { useAuth } from "@web/src/features/auth";
import { Card, Empty, Tag, Typography, theme } from "antd";
import type React from "react";

const { Text } = Typography;

export const AdminDashboardPage: React.FC = () => {
    const { token } = theme.useToken();
    const { user } = useAuth();
    const { data: userData, isPending: isLoading } = useAdminUsers();
    const users = userData?.items || [];

    const totalUsers = users.length || 0;
    const adminUsers = users.filter((u: any) => u.role === "admin").length || 0;
    const bannedUsers = users.filter((u: any) => u.banned).length || 0;

    return (
        <PageShell fill={false}>
            <PageHeader
                title="Admin Dashboard"
                subtitle="Manage all system users."
                actions={
                    <Tag color="blue" className="text-sm px-3 py-1">
                        Logged in as: {user?.name}
                    </Tag>
                }
            />

            <SummaryCardsRow
                loading={isLoading}
                items={[
                    {
                        key: "total",
                        label: "Total Users",
                        value: totalUsers,
                        icon: <TeamOutlined />,
                    },
                    {
                        key: "admins",
                        label: "Platform Admins",
                        value: adminUsers,
                        icon: <SafetyOutlined />,
                        color: token.colorWarning,
                    },
                    {
                        key: "banned",
                        label: "Banned Users",
                        value: bannedUsers,
                        icon: <StopOutlined />,
                        color: bannedUsers > 0 ? token.colorError : token.colorSuccess,
                    },
                ]}
            />

            <Card className="mt-8">
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span>
                            <strong>More metrics coming soon</strong>
                            <br />
                            <Text type="secondary">
                                Reserved for administrative analytics and future charts.
                            </Text>
                        </span>
                    }
                />
            </Card>
        </PageShell>
    );
};
