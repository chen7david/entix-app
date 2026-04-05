import {
    DatabaseOutlined,
    TeamOutlined,
    ThunderboltOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import type { BulkMetrics } from "@web/src/features/organization";

interface DashboardMetricCardsProps {
    metrics?: BulkMetrics;
    loading: boolean;
}

const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

export const DashboardMetricCards = ({ metrics, loading }: DashboardMetricCardsProps) => {
    return (
        <SummaryCardsRow
            loading={loading}
            items={[
                {
                    key: "members",
                    label: "Total Members",
                    value: metrics?.totalMembers || 0,
                    icon: <TeamOutlined />,
                    color: "#2563eb",
                },
                {
                    key: "sessions",
                    label: "Active Sessions",
                    value: metrics?.activeSessions || 0,
                    icon: <ThunderboltOutlined />,
                    color: "#10b981",
                },
                {
                    key: "risk",
                    label: "Engagement Risk",
                    value: metrics?.engagementRisk || 0,
                    icon: <WarningOutlined />,
                    color: (metrics?.engagementRisk || 0) > 0 ? "#fa8c16" : "#10b981",
                },
                {
                    key: "storage",
                    label: "Storage Used",
                    value: formatBytes(metrics?.totalStorage || 0),
                    icon: <DatabaseOutlined />,
                    color: "#8b5cf6",
                },
            ]}
        />
    );
};
