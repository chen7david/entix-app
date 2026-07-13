import {
    DatabaseOutlined,
    TeamOutlined,
    ThunderboltOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import type { BulkMetrics } from "@web/src/features/organization";
import { NumberUtils } from "@web/src/utils/number";
import { theme } from "antd";

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
    const { token } = theme.useToken();

    return (
        <SummaryCardsRow
            loading={loading}
            items={[
                {
                    key: "members",
                    label: "Total Members",
                    value: NumberUtils.formatNumber(metrics?.totalMembers || 0),
                    icon: <TeamOutlined />,
                },
                {
                    key: "sessions",
                    label: "Active Sessions",
                    value: NumberUtils.formatNumber(metrics?.activeSessions || 0),
                    icon: <ThunderboltOutlined />,
                    color: token.colorSuccess,
                },
                {
                    key: "risk",
                    label: "Engagement Risk",
                    value: NumberUtils.formatNumber(metrics?.engagementRisk || 0),
                    icon: <WarningOutlined />,
                    color:
                        (metrics?.engagementRisk || 0) > 0
                            ? token.colorWarning
                            : token.colorSuccess,
                },
                {
                    key: "storage",
                    label: "Storage Used",
                    value: formatBytes(metrics?.totalStorage || 0),
                    icon: <DatabaseOutlined />,
                    color: token.colorInfo,
                },
            ]}
        />
    );
};
