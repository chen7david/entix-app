import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import type React from "react";

type Props = {
    metrics?: {
        total: number;
        completed: number;
        cancelled: number;
    } | null;
    loading?: boolean;
};

export const ScheduleMetricsGrid: React.FC<Props> = ({ metrics, loading }) => {
    return (
        <SummaryCardsRow
            loading={loading}
            items={[
                {
                    key: "total",
                    label: "Total Sessions",
                    value: metrics?.total || 0,
                    icon: <ClockCircleOutlined />,
                    color: "#2563eb",
                },
                {
                    key: "completed",
                    label: "Completed",
                    value: metrics?.completed || 0,
                    icon: <CheckCircleOutlined />,
                    color: "#10b981",
                },
                {
                    key: "cancelled",
                    label: "Cancelled",
                    value: metrics?.cancelled || 0,
                    icon: <CloseCircleOutlined />,
                    color: "#ef4444",
                },
            ]}
        />
    );
};
