import { SafetyOutlined, StopOutlined, TeamOutlined } from "@ant-design/icons";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { UserTable, useAdminUsers } from "@web/src/features/admin";
import type React from "react";

export const GlobalUsersPage: React.FC = () => {
    const { data: userData, isPending: isLoading } = useAdminUsers();
    const users = userData?.items || [];

    const totalUsers = users.length || 0;
    const adminUsers = users.filter((u: any) => u.role === "admin").length || 0;
    const bannedUsers = users.filter((u: any) => u.banned).length || 0;

    return (
        <div>
            <PageHeader
                title="Global Users"
                subtitle="Manage all platform users, roles, and access controls from a centralized authority."
            />

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
