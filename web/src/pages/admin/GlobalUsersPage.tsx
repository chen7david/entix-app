import { SafetyOutlined, StopOutlined, TeamOutlined } from "@ant-design/icons";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import { UserTable, useAdminUsers } from "@web/src/features/admin";
import { Typography } from "antd";
import type React from "react";

const { Title, Text } = Typography;

export const GlobalUsersPage: React.FC = () => {
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
                        Global Users
                    </Title>
                    <Text type="secondary">Manage all platform users, roles, and access</Text>
                </div>
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
                        color: "#ef4444",
                    },
                ]}
            />

            <UserTable />
        </div>
    );
};
