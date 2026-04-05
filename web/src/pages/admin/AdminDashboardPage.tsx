import { SafetyOutlined, StopOutlined, TeamOutlined } from "@ant-design/icons";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import { useAdminUsers } from "@web/src/features/admin";
import { useAuth } from "@web/src/features/auth";
import { Card, Empty, Tag, Typography } from "antd";
import type React from "react";

const { Title, Text } = Typography;

export const AdminDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { data: userData, isPending: isLoading } = useAdminUsers();
    const users = userData?.items || [];

    const totalUsers = users.length || 0;
    const adminUsers = users.filter((u: any) => u.role === "admin").length || 0;
    const bannedUsers = users.filter((u: any) => u.banned).length || 0;

    return (
        <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        Admin Dashboard
                    </Title>
                    <Text type="secondary">Manage all system users</Text>
                </div>
                <Tag color="blue" className="text-sm px-3 py-1">
                    Logged in as: {user?.name}
                </Tag>
            </div>

            <SummaryCardsRow
                loading={isLoading}
                items={[
                    {
                        key: "total",
                        label: "Total Users",
                        value: totalUsers,
                        icon: <TeamOutlined />,
                        color: "#2563eb",
                    },
                    {
                        key: "admins",
                        label: "Platform Admins",
                        value: adminUsers,
                        icon: <SafetyOutlined />,
                        color: "#f59e0b",
                    },
                    {
                        key: "banned",
                        label: "Banned Users",
                        value: bannedUsers,
                        icon: <StopOutlined />,
                        color: bannedUsers > 0 ? "#ef4444" : "#10b981",
                    },
                ]}
            />

            <Card style={{ marginTop: 32 }}>
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span>
                            <strong>More Metrics Coming Soon</strong>
                            <br />
                            <Text type="secondary">
                                Reserved for administrative analytics and future charts.
                            </Text>
                        </span>
                    }
                />
            </Card>
        </div>
    );
};
